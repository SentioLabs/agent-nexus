#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const errors = [];
const opencodeRootDir = path.join(repoRoot, "opencode-marketplace");
const opencodePluginsDir = path.join(opencodeRootDir, "plugins");
const installDocPath = path.join(repoRoot, ".opencode", "INSTALL.md");
const seenSkillNames = new Map();
const seenCommandNames = new Map();
const seenAgentNames = new Map();
const seenRuntimePluginNames = new Map();

function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      files.push(fullPath);
    }
  }

  return files;
}

function validateMarkdownPrefix(rootDir, pluginName, kind) {
  if (!fs.existsSync(rootDir)) {
    return;
  }
  if (!fs.statSync(rootDir).isDirectory()) {
    errors.push(`${path.relative(repoRoot, rootDir)} must be a directory`);
    return;
  }

  for (const fullPath of walkFiles(rootDir)) {
    if (path.extname(fullPath) !== ".md") {
      continue;
    }
    const baseName = path.basename(fullPath);
    if (!baseName.startsWith(`${pluginName}-`)) {
      errors.push(
        `${path.relative(repoRoot, fullPath)} must start with '${pluginName}-' because OpenCode ${kind} names are flat`,
      );
    }
  }
}

function rememberFlatName(map, name, owner, kind) {
  const previous = map.get(name);
  if (previous) {
    errors.push(`${kind} name '${name}' is duplicated by ${previous} and ${owner}`);
    return;
  }
  map.set(name, owner);
}

function validateRuntimePluginFiles(rootDir, pluginName) {
  if (!fs.existsSync(rootDir)) {
    return;
  }
  if (!fs.statSync(rootDir).isDirectory()) {
    errors.push(`${path.relative(repoRoot, rootDir)} must be a directory`);
    return;
  }

  for (const fullPath of walkFiles(rootDir)) {
    const relativePath = path.relative(rootDir, fullPath);
    if (path.dirname(relativePath) !== ".") {
      errors.push(
        `${path.relative(repoRoot, fullPath)} must live directly under plugins/ so installs into .opencode/plugins/ stay collision-free`,
      );
    }
    const ext = path.extname(fullPath);
    if (!new Set([".js", ".mjs", ".ts"]).has(ext)) {
      errors.push(
        `${path.relative(repoRoot, fullPath)} must be a .js, .mjs, or .ts OpenCode plugin file`,
      );
      continue;
    }
    if (!path.basename(fullPath).startsWith(`${pluginName}.`)) {
      errors.push(
        `${path.relative(repoRoot, fullPath)} must start with '${pluginName}.' so installed plugin filenames stay unique`,
      );
    }
    rememberFlatName(
      seenRuntimePluginNames,
      path.basename(fullPath),
      path.relative(opencodePluginsDir, fullPath),
      "runtime plugin file",
    );
  }
}

function getInstallSection(installDoc, pluginName) {
  const header = `### ${pluginName}`;
  const sectionStart = installDoc.indexOf(header);
  if (sectionStart === -1) {
    return "";
  }

  const nextPluginSection = installDoc.indexOf("\n### ", sectionStart + header.length);
  const nextTopLevelSection = installDoc.indexOf("\n## ", sectionStart + header.length);
  const sectionEndCandidates = [nextPluginSection, nextTopLevelSection].filter((index) => index !== -1);
  const sectionEnd = sectionEndCandidates.length > 0 ? Math.min(...sectionEndCandidates) : installDoc.length;
  return installDoc.slice(sectionStart, sectionEnd);
}

function expectedInstallArtifacts(pluginRoot) {
  const artifacts = [];
  const commandsDir = path.join(pluginRoot, "commands");
  const skillsDir = path.join(pluginRoot, "skills");
  const agentsDir = path.join(pluginRoot, "agents");
  const runtimePluginsDir = path.join(pluginRoot, "plugins");
  const fragmentFile = path.join(pluginRoot, "opencode.fragment.json");

  if (fs.existsSync(commandsDir) && fs.statSync(commandsDir).isDirectory()) {
    for (const fullPath of walkFiles(commandsDir)) {
      if (path.extname(fullPath) === ".md") {
        artifacts.push({
          docPath: path.posix.join("commands", path.relative(commandsDir, fullPath).split(path.sep).join("/")),
          sourcePath: path.relative(pluginRoot, fullPath).split(path.sep).join("/"),
        });
      }
    }
  }

  if (fs.existsSync(skillsDir) && fs.statSync(skillsDir).isDirectory()) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const skillRoot = path.join(skillsDir, entry.name);
        for (const fullPath of walkFiles(skillRoot)) {
          artifacts.push({
            docPath: path.posix.join(
              "skills",
              entry.name,
              path.relative(skillRoot, fullPath).split(path.sep).join("/"),
            ),
            sourcePath: path.relative(pluginRoot, fullPath).split(path.sep).join("/"),
          });
        }
      }
    }
  }

  if (fs.existsSync(agentsDir) && fs.statSync(agentsDir).isDirectory()) {
    for (const fullPath of walkFiles(agentsDir)) {
      if (path.extname(fullPath) === ".md") {
        artifacts.push({
          docPath: path.posix.join("agents", path.relative(agentsDir, fullPath).split(path.sep).join("/")),
          sourcePath: path.relative(pluginRoot, fullPath).split(path.sep).join("/"),
        });
      }
    }
  }

  if (fs.existsSync(runtimePluginsDir) && fs.statSync(runtimePluginsDir).isDirectory()) {
    for (const fullPath of walkFiles(runtimePluginsDir)) {
      artifacts.push({
        docPath: `plugins/${path.basename(fullPath)}`,
        sourcePath: path.relative(pluginRoot, fullPath).split(path.sep).join("/"),
      });
    }
  }

  if (fs.existsSync(fragmentFile)) {
    artifacts.push({
      docPath: "opencode.json",
      sourcePath: "opencode.fragment.json",
    });
  }

  return artifacts;
}

function validateInstallCoverage(pluginName, pluginRoot, installSection) {
  for (const artifact of expectedInstallArtifacts(pluginRoot)) {
    if (!installSection.includes(`\`${artifact.docPath}\``)) {
      errors.push(
        `.opencode/INSTALL.md is missing installed target path '${artifact.docPath}' for plugin '${pluginName}'`,
      );
    }
    const installSourcePath = `opencode-marketplace/plugins/${pluginName}/${artifact.sourcePath}`;
    const sourceMentions = installSection.split(installSourcePath).length - 1;
    if (sourceMentions < 2) {
      errors.push(
        `.opencode/INSTALL.md is missing full local/remote source coverage for '${artifact.sourcePath}' in plugin '${pluginName}'`,
      );
    }
  }
}

if (!fs.existsSync(opencodeRootDir)) {
  errors.push("Missing required directory: opencode-marketplace");
}

if (fs.existsSync(opencodePluginsDir) && !fs.statSync(opencodePluginsDir).isDirectory()) {
  errors.push("opencode-marketplace/plugins must be a directory");
}

if (!fs.existsSync(installDocPath)) {
  errors.push("Missing required file: .opencode/INSTALL.md");
}

if (errors.length === 0) {
  if (!fs.existsSync(opencodePluginsDir)) {
    console.log(
      "OpenCode marketplace validation passed (plugins directory not present yet; expected before migration).",
    );
    process.exit(0);
  }

  const pluginDirs = fs
    .readdirSync(opencodePluginsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const installDoc = fs.readFileSync(installDocPath, "utf8");

  if (pluginDirs.length === 0) {
    console.log(
      "OpenCode marketplace validation passed (no plugins present yet; expected before migration).",
    );
    process.exit(0);
  }

  for (const pluginName of pluginDirs) {
    const pluginRoot = path.join(opencodePluginsDir, pluginName);
    const versionFile = path.join(pluginRoot, "version.txt");
    const changelogFile = path.join(pluginRoot, "CHANGELOG.md");
    const fragmentFile = path.join(pluginRoot, "opencode.fragment.json");
    const skillsDir = path.join(pluginRoot, "skills");
    const commandsDir = path.join(pluginRoot, "commands");
    const agentsDir = path.join(pluginRoot, "agents");
    const runtimePluginsDir = path.join(pluginRoot, "plugins");

    if (!installDoc.includes(`- \`${pluginName}\``)) {
      errors.push(`.opencode/INSTALL.md is missing plugin selection '${pluginName}'`);
    }
    if (!installDoc.includes(`### ${pluginName}`)) {
      errors.push(`.opencode/INSTALL.md is missing a file mapping section for '${pluginName}'`);
    }
    const installSection = getInstallSection(installDoc, pluginName);

    if (!fs.existsSync(versionFile)) {
      errors.push(`Plugin '${pluginName}' is missing version.txt`);
    }

    if (!fs.existsSync(changelogFile)) {
      errors.push(`Plugin '${pluginName}' is missing CHANGELOG.md`);
    }

    if (fs.existsSync(fragmentFile)) {
      try {
        JSON.parse(fs.readFileSync(fragmentFile, "utf8"));
      } catch (error) {
        errors.push(
          `Plugin '${pluginName}' has invalid JSON in opencode.fragment.json: ${error.message}`,
        );
      }
    }

    if (fs.existsSync(skillsDir)) {
      if (!fs.statSync(skillsDir).isDirectory()) {
        errors.push(`Plugin '${pluginName}' has a non-directory skills path`);
      } else {
        for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
          if (!entry.isDirectory()) {
            errors.push(
              `Plugin '${pluginName}' has a non-directory entry under skills/: ${entry.name}`,
            );
            continue;
          }
          rememberFlatName(
            seenSkillNames,
            entry.name,
            `plugins/${pluginName}/skills/${entry.name}`,
            "skill",
          );
          const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
          if (!fs.existsSync(skillFile)) {
            errors.push(
              `Plugin '${pluginName}' is missing skills/${entry.name}/SKILL.md`,
            );
          }
        }
      }
    }

    validateMarkdownPrefix(commandsDir, pluginName, "command");
    validateMarkdownPrefix(agentsDir, pluginName, "agent");
    validateRuntimePluginFiles(runtimePluginsDir, pluginName);
    validateInstallCoverage(pluginName, pluginRoot, installSection);

    if (fs.existsSync(commandsDir) && fs.statSync(commandsDir).isDirectory()) {
      for (const fullPath of walkFiles(commandsDir)) {
        if (path.extname(fullPath) !== ".md") {
          continue;
        }
        rememberFlatName(
          seenCommandNames,
          path.basename(fullPath, ".md"),
          path.relative(opencodePluginsDir, fullPath),
          "command",
        );
      }
    }

    if (fs.existsSync(agentsDir) && fs.statSync(agentsDir).isDirectory()) {
      for (const fullPath of walkFiles(agentsDir)) {
        if (path.extname(fullPath) !== ".md") {
          continue;
        }
        rememberFlatName(
          seenAgentNames,
          path.basename(fullPath, ".md"),
          path.relative(opencodePluginsDir, fullPath),
          "agent",
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("OpenCode marketplace validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("OpenCode marketplace validation passed.");

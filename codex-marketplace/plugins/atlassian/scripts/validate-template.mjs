#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const errors = [];
const warnings = [];

const pluginNamePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const marketplaceNamePattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(targetPath, context) {
  try {
    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      addError(`${context} exists but is not a directory: ${targetPath}`);
      return false;
    }
    return true;
  } catch {
    addError(`${context} directory is missing: ${targetPath}`);
    return false;
  }
}

async function readJsonFile(filePath, context) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    addError(`${context} is missing: ${filePath}`);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    addError(`${context} contains invalid JSON (${filePath}): ${error.message}`);
    return null;
  }
}

function normalizeNewlines(content) {
  return content.replace(/\r\n/g, "\n");
}

function parseFrontmatter(content) {
  const normalized = normalizeNewlines(content);
  if (!normalized.startsWith("---\n")) {
    return null;
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex === -1) {
    return null;
  }

  const fields = {};
  const frontmatterBlock = normalized.slice(4, closingIndex);

  for (const line of frontmatterBlock.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    fields[key] = value;
  }

  return fields;
}

async function walkFiles(dirPath) {
  const files = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return true;
  }
  if (path.isAbsolute(value)) {
    return false;
  }
  const normalized = path.posix.normalize(value.replace(/\\/g, "/"));
  return normalized !== ".." && !normalized.startsWith("../");
}

function extractPathValues(value) {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractPathValues(entry));
  }

  if (value && typeof value === "object") {
    const candidates = [];
    if (typeof value.path === "string") {
      candidates.push(value.path);
    }
    if (typeof value.file === "string") {
      candidates.push(value.file);
    }
    return candidates;
  }

  return [];
}

async function validateReferencedPath(pluginDir, fieldName, pathValue, pluginName) {
  if (pathValue.startsWith("http://") || pathValue.startsWith("https://")) {
    return;
  }

  if (!isSafeRelativePath(pathValue)) {
    addError(
      `${pluginName}: field "${fieldName}" has invalid path "${pathValue}". Use a safe relative path.`
    );
    return;
  }

  const resolved = path.resolve(pluginDir, pathValue);
  if (!(await pathExists(resolved))) {
    addError(`${pluginName}: field "${fieldName}" references missing path "${pathValue}".`);
  }
}

async function validateFrontmatterFile(filePath, componentName, requiredKeys, pluginName) {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = parseFrontmatter(content);
  const relativeFile = path.relative(repoRoot, filePath);

  if (!parsed) {
    addError(`${pluginName}: ${componentName} file missing YAML frontmatter: ${relativeFile}`);
    return;
  }

  for (const key of requiredKeys) {
    if (!parsed[key] || parsed[key].length === 0) {
      addError(`${pluginName}: ${componentName} file missing "${key}" in frontmatter: ${relativeFile}`);
    }
  }
}

async function validateComponentFrontmatter(pluginDir, pluginName) {
  const componentDirs = [
    { dir: "rules", component: "rule", exts: new Set([".md", ".mdc", ".markdown"]), keys: ["description"] },
    { dir: "agents", component: "agent", exts: new Set([".md", ".mdc", ".markdown"]), keys: ["description"] },
    { dir: "commands", component: "command", exts: new Set([".md", ".mdc", ".markdown", ".txt"]), keys: ["description"] }
  ];

  for (const { dir, component, exts, keys } of componentDirs) {
    const targetDir = path.join(pluginDir, dir);
    if (!(await pathExists(targetDir))) {
      continue;
    }

    const files = await walkFiles(targetDir);
    for (const file of files) {
      if (exts.has(path.extname(file).toLowerCase())) {
        await validateFrontmatterFile(file, component, keys, pluginName);
      }
    }
  }

  const skillsDir = path.join(pluginDir, "skills");
  if (!(await pathExists(skillsDir))) {
    return;
  }

  const skillFiles = await walkFiles(skillsDir);
  for (const file of skillFiles) {
    if (path.basename(file) === "SKILL.md") {
      await validateFrontmatterFile(file, "skill", ["name", "description"], pluginName);
    }
  }
}

async function validateOnePlugin(pluginDir, pluginName) {
  const manifestPath = path.join(pluginDir, ".codex-plugin", "plugin.json");
  const pluginManifest = await readJsonFile(manifestPath, `${pluginName} plugin manifest`);
  if (!pluginManifest) {
    return;
  }

  if (typeof pluginManifest.name !== "string" || !pluginNamePattern.test(pluginManifest.name)) {
    addError(
      `${pluginName}: "name" in plugin.json must be lowercase and use only alphanumerics, hyphens, and periods.`
    );
  }

  if (typeof pluginManifest.version !== "string" || pluginManifest.version.length === 0) {
    addError(`${pluginName}: "version" in plugin.json is required.`);
  }

  if (typeof pluginManifest.description !== "string" || pluginManifest.description.length === 0) {
    addError(`${pluginName}: "description" in plugin.json is required.`);
  }

  if (pluginManifest.interface !== undefined && typeof pluginManifest.interface !== "object") {
    addError(`${pluginName}: "interface" in plugin.json must be an object when present.`);
  }

  const pathFields = {
    skills: pluginManifest.skills,
    hooks: pluginManifest.hooks,
    mcpServers: pluginManifest.mcpServers,
    apps: pluginManifest.apps,
    composerIcon: pluginManifest.interface?.composerIcon,
    logo: pluginManifest.interface?.logo,
    screenshots: pluginManifest.interface?.screenshots
  };

  for (const [fieldName, value] of Object.entries(pathFields)) {
    for (const pathValue of extractPathValues(value)) {
      await validateReferencedPath(pluginDir, fieldName, pathValue, pluginName);
    }
  }

  await validateComponentFrontmatter(pluginDir, pluginName);

  if (!pluginManifest.skills) {
    addWarning(`${pluginName}: no explicit "skills" path configured in plugin.json.`);
  }
}

function resolveMarketplaceSource(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  if (entry.source !== "local") {
    return null;
  }
  return entry.path;
}

async function validateMarketplace() {
  const marketplacePath = path.join(repoRoot, ".agents", "plugins", "marketplace.json");
  const marketplace = await readJsonFile(marketplacePath, "Marketplace manifest");
  if (!marketplace) {
    return;
  }

  if (typeof marketplace.name !== "string" || !marketplaceNamePattern.test(marketplace.name)) {
    addError(
      'Marketplace "name" must be lowercase kebab-case and start/end with an alphanumeric character.'
    );
  }

  if (marketplace.interface !== undefined && typeof marketplace.interface !== "object") {
    addError('Marketplace "interface" must be an object when present.');
  }

  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    addError('Marketplace "plugins" must be a non-empty array.');
    return;
  }

  const seenNames = new Set();
  for (const [index, entry] of marketplace.plugins.entries()) {
    const label = `plugins[${index}]`;

    if (!entry || typeof entry !== "object") {
      addError(`${label} must be an object.`);
      continue;
    }

    if (typeof entry.name !== "string" || !pluginNamePattern.test(entry.name)) {
      addError(`${label}.name must be lowercase and use only alphanumerics, hyphens, and periods.`);
      continue;
    }

    if (seenNames.has(entry.name)) {
      addError(`Duplicate plugin name in marketplace manifest: "${entry.name}"`);
    }
    seenNames.add(entry.name);

    const sourcePath = resolveMarketplaceSource(entry.source);
    if (!sourcePath) {
      addError(`${label}.source must be an object with source="local" and a path.`);
      continue;
    }

    if (!isSafeRelativePath(sourcePath)) {
      addError(`${label}.source.path is not a safe relative path: "${sourcePath}"`);
      continue;
    }

    if (!entry.policy || typeof entry.policy !== "object") {
      addError(`${label}.policy must be an object.`);
      continue;
    }

    if (typeof entry.policy.installation !== "string" || entry.policy.installation.length === 0) {
      addError(`${label}.policy.installation is required.`);
    }

    if (typeof entry.policy.authentication !== "string" || entry.policy.authentication.length === 0) {
      addError(`${label}.policy.authentication is required.`);
    }

    if (typeof entry.category !== "string" || entry.category.length === 0) {
      addError(`${label}.category is required.`);
    }

    const pluginDir = path.join(repoRoot, sourcePath);
    const pluginDirExists = await ensureDirectory(pluginDir, `${label}.source.path`);
    if (!pluginDirExists) {
      continue;
    }

    const manifestPath = path.join(pluginDir, ".codex-plugin", "plugin.json");
    const pluginManifest = await readJsonFile(manifestPath, `${entry.name} plugin manifest`);
    if (!pluginManifest) {
      continue;
    }

    if (pluginManifest.name && pluginManifest.name !== entry.name) {
      addError(
        `${entry.name}: marketplace entry name does not match plugin.json name ("${pluginManifest.name}").`
      );
    }

    await validateOnePlugin(pluginDir, entry.name);
  }
}

function summarizeAndExit() {
  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.error("Validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Validation passed.");
}

async function main() {
  const marketplacePath = path.join(repoRoot, ".agents", "plugins", "marketplace.json");
  const rootManifestPath = path.join(repoRoot, ".codex-plugin", "plugin.json");

  const hasMarketplace = await pathExists(marketplacePath);
  const hasRootPlugin = await pathExists(rootManifestPath);

  if (!hasMarketplace && hasRootPlugin) {
    const pluginManifest = await readJsonFile(rootManifestPath, "Plugin manifest");
    if (pluginManifest) {
      const pluginName = pluginManifest.name || "plugin";
      await validateOnePlugin(repoRoot, pluginName);
    }
    summarizeAndExit();
    return;
  }

  if (!hasMarketplace) {
    addError("No .agents/plugins/marketplace.json and no .codex-plugin/plugin.json found.");
    summarizeAndExit();
    return;
  }

  await validateMarketplace();
  summarizeAndExit();
}

await main();

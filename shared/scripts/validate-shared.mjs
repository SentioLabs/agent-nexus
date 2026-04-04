#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const errors = [];

function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function ensureDir(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required directory: ${relativePath}`);
    return;
  }
  if (!fs.statSync(fullPath).isDirectory()) {
    errors.push(`${relativePath} must be a directory`);
  }
}

function walkFiles(relativeDir) {
  const root = path.join(repoRoot, relativeDir);
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      files.push(path.relative(repoRoot, full));
    }
  }
  return files;
}

function validateClaudeManifest() {
  const manifestPath = ".claude-plugin/marketplace.json";
  const manifest = readJson(manifestPath);
  if (!manifest || !Array.isArray(manifest.plugins)) {
    errors.push(`${manifestPath} must include a plugins array`);
    return;
  }

  for (const plugin of manifest.plugins) {
    const source = plugin?.source;
    if (typeof source !== "string") {
      errors.push(
        `Claude plugin '${plugin?.name ?? "<unknown>"}' has a non-string source`,
      );
      continue;
    }
    if (!source.startsWith("./claude-marketplace/plugins/")) {
      errors.push(
        `Claude plugin '${plugin?.name ?? "<unknown>"}' must source from ./claude-marketplace/plugins/... (found: ${source})`,
      );
    }
  }
}

function validateCodexManifest() {
  const manifestPath = ".agents/plugins/marketplace.json";
  const manifest = readJson(manifestPath);
  if (!manifest || !Array.isArray(manifest.plugins)) {
    errors.push(`${manifestPath} must include a plugins array`);
    return;
  }

  for (const plugin of manifest.plugins) {
    const sourcePath = plugin?.source?.path;
    if (typeof sourcePath !== "string") {
      errors.push(
        `Codex plugin '${plugin?.name ?? "<unknown>"}' has no source.path string`,
      );
      continue;
    }
    if (!sourcePath.startsWith("./codex-marketplace/plugins/")) {
      errors.push(
        `Codex plugin '${plugin?.name ?? "<unknown>"}' must source from ./codex-marketplace/plugins/... (found: ${sourcePath})`,
      );
    }
  }
}

function validateSharedLayout() {
  ensureDir("shared");
  ensureDir("claude-marketplace");
  ensureDir("codex-marketplace");

  const sharedRoot = path.join(repoRoot, "shared");
  if (!fs.existsSync(sharedRoot) || !fs.statSync(sharedRoot).isDirectory()) {
    return;
  }

  const runtimePathSignals = [
    `${path.sep}skills${path.sep}`,
    `${path.sep}commands${path.sep}`,
    `${path.sep}agents${path.sep}`,
    `${path.sep}plugins${path.sep}`,
    `${path.sep}.claude-plugin${path.sep}`,
    `${path.sep}.codex-plugin${path.sep}`,
  ];
  const runtimeFileNames = new Set(["SKILL.md", "plugin.json", "hooks.json", ".mcp.json"]);

  for (const relativeFile of walkFiles("shared")) {
    const normalized = `${path.sep}${relativeFile.split(path.sep).join(path.sep)}${path.sep}`;
    if (runtimePathSignals.some((signal) => normalized.includes(signal))) {
      errors.push(`Runtime-like path not allowed under shared/: ${relativeFile}`);
      continue;
    }

    const baseName = path.basename(relativeFile);
    if (runtimeFileNames.has(baseName)) {
      errors.push(`Runtime-like file not allowed under shared/: ${relativeFile}`);
    }
  }
}

validateClaudeManifest();
validateCodexManifest();
validateSharedLayout();

if (errors.length > 0) {
  console.error("Shared layout validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Shared layout validation passed.");

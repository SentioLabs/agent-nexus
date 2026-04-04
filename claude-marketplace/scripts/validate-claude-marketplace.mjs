#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const errors = [];
const claudeRootDir = path.join(repoRoot, "claude-marketplace");
const claudePluginsDir = path.join(repoRoot, "claude-marketplace", "plugins");

if (!fs.existsSync(claudeRootDir)) {
  errors.push("Missing required directory: claude-marketplace");
}

if (fs.existsSync(claudePluginsDir) && !fs.statSync(claudePluginsDir).isDirectory()) {
  errors.push("claude-marketplace/plugins must be a directory");
}

if (errors.length === 0) {
  if (!fs.existsSync(claudePluginsDir)) {
    console.log(
      "Claude marketplace validation passed (plugins directory not present yet; expected before migration).",
    );
    process.exit(0);
  }

  const pluginDirs = fs
    .readdirSync(claudePluginsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (pluginDirs.length === 0) {
    console.log(
      "Claude marketplace validation passed (no plugins present yet; expected before migration).",
    );
    process.exit(0);
  }

  for (const pluginName of pluginDirs) {
    const manifestPath = path.join(
      claudePluginsDir,
      pluginName,
      ".claude-plugin",
      "plugin.json",
    );
    if (!fs.existsSync(manifestPath)) {
      errors.push(
        `Plugin '${pluginName}' is missing .claude-plugin/plugin.json in claude-marketplace/plugins/${pluginName}`,
      );
      continue;
    }

    try {
      JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
      errors.push(
        `Plugin '${pluginName}' has invalid JSON in .claude-plugin/plugin.json: ${error.message}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Claude marketplace validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Claude marketplace validation passed.");

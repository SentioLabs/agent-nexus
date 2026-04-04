#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const errors = [];
const codexRootDir = path.join(repoRoot, "codex-marketplace");
const codexPluginsDir = path.join(repoRoot, "codex-marketplace", "plugins");

if (!fs.existsSync(codexRootDir)) {
  errors.push("Missing required directory: codex-marketplace");
}

if (fs.existsSync(codexPluginsDir) && !fs.statSync(codexPluginsDir).isDirectory()) {
  errors.push("codex-marketplace/plugins must be a directory");
}

if (errors.length === 0) {
  if (!fs.existsSync(codexPluginsDir)) {
    console.log(
      "Codex marketplace validation passed (plugins directory not present yet; expected before migration).",
    );
    process.exit(0);
  }

  const pluginDirs = fs
    .readdirSync(codexPluginsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (pluginDirs.length === 0) {
    console.log(
      "Codex marketplace validation passed (no plugins present yet; expected before migration).",
    );
    process.exit(0);
  }

  for (const pluginName of pluginDirs) {
    const pluginRoot = path.join(codexPluginsDir, pluginName);
    const codexManifest = path.join(pluginRoot, ".codex-plugin", "plugin.json");
    const mcpManifest = path.join(pluginRoot, ".mcp.json");

    if (!fs.existsSync(codexManifest) && !fs.existsSync(mcpManifest)) {
      errors.push(
        `Plugin '${pluginName}' must include .codex-plugin/plugin.json or .mcp.json`,
      );
      continue;
    }

    if (fs.existsSync(codexManifest)) {
      try {
        JSON.parse(fs.readFileSync(codexManifest, "utf8"));
      } catch (error) {
        errors.push(
          `Plugin '${pluginName}' has invalid JSON in .codex-plugin/plugin.json: ${error.message}`,
        );
      }
    }

    if (fs.existsSync(mcpManifest)) {
      try {
        JSON.parse(fs.readFileSync(mcpManifest, "utf8"));
      } catch (error) {
        errors.push(
          `Plugin '${pluginName}' has invalid JSON in .mcp.json: ${error.message}`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Codex marketplace validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Codex marketplace validation passed.");

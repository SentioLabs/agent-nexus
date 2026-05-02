import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.dirname(fileURLToPath(import.meta.url));

function readMarkdownAsset(assetPath) {
  const content = fs.readFileSync(assetPath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content.trim() };
  }
  return {
    frontmatter: parseFrontmatter(match[1]),
    body: match[2].trim(),
  };
}

function parseFrontmatter(source) {
  const result = {};
  let currentObject;

  for (const line of source.split("\n")) {
    if (line.trim() === "") {
      continue;
    }

    const nested = line.match(/^\s+([^:]+):\s*(.*)$/);
    if (nested && currentObject) {
      currentObject[nested[1].trim()] = parseScalar(nested[2]);
      continue;
    }

    const entry = line.match(/^([^:]+):\s*(.*)$/);
    if (!entry) {
      continue;
    }

    const key = entry[1].trim();
    const value = entry[2];
    if (value === "") {
      result[key] = {};
      currentObject = result[key];
      continue;
    }

    result[key] = parseScalar(value);
    currentObject = undefined;
  }

  return result;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  return trimmed;
}

function listMarkdownFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

function loadCommands() {
  const commands = {};
  const commandsDir = path.join(pluginRoot, "commands");

  for (const filePath of listMarkdownFiles(commandsDir)) {
    const { frontmatter, body } = readMarkdownAsset(filePath);
    commands[path.basename(filePath, ".md")] = {
      ...frontmatter,
      template: body,
    };
  }

  return commands;
}

function loadAgents() {
  const agents = {};
  const agentsDir = path.join(pluginRoot, "agents");

  for (const filePath of listMarkdownFiles(agentsDir)) {
    const { frontmatter, body } = readMarkdownAsset(filePath);
    const permission = permissionsFromTools(frontmatter.tools);
    agents[path.basename(filePath, ".md")] = {
      ...frontmatter,
      ...(Object.keys(permission).length > 0 ? { permission } : {}),
      prompt: body,
    };
  }

  return agents;
}

function permissionsFromTools(tools = {}) {
  const supportedPermissions = new Set(["bash", "edit", "webfetch", "doom_loop", "external_directory"]);
  const permission = {};

  for (const [toolName, enabled] of Object.entries(tools)) {
    if (supportedPermissions.has(toolName)) {
      permission[toolName] = enabled ? "allow" : "deny";
    }
  }

  return permission;
}

function addDefaults(target, defaults) {
  for (const [key, value] of Object.entries(defaults)) {
    if (target[key] === undefined) {
      target[key] = value;
    }
  }
}

export const ArcPlugin = async ({ $ }) => ({
  config: async (config) => {
    config.command ??= {};
    config.agent ??= {};
    config.skills ??= {};
    config.skills.paths ??= [];

    addDefaults(config.command, loadCommands());
    addDefaults(config.agent, loadAgents());

    const skillsPath = path.join(pluginRoot, "skills");
    if (!config.skills.paths.includes(skillsPath)) {
      config.skills.paths.push(skillsPath);
    }
  },
  event: async ({ event }) => {
    if (event.type !== "session.created" && event.type !== "session.compacted") {
      return;
    }
    try {
      await $`arc prime`;
    } catch {
      // Fail open so missing or unhealthy arc never blocks OpenCode.
    }
  },
});

export default ArcPlugin;

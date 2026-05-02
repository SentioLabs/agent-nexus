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

  for (const line of source.split("\n")) {
    const entry = line.match(/^([^:]+):\s*(.*)$/);
    if (!entry) {
      continue;
    }

    result[entry[1].trim()] = entry[2].trim();
  }

  return result;
}

function loadCommand(name) {
  const { frontmatter, body } = readMarkdownAsset(path.join(pluginRoot, "commands", `${name}.md`));
  return {
    ...frontmatter,
    template: body,
  };
}

export const SlopReviewPlugin = async () => ({
  config: async (config) => {
    config.command ??= {};
    config.skills ??= {};
    config.skills.paths ??= [];

    config.command["slop-review-review"] ??= loadCommand("slop-review-review");

    const skillsPath = path.join(pluginRoot, "skills");
    if (!config.skills.paths.includes(skillsPath)) {
      config.skills.paths.push(skillsPath);
    }
  },
});

export default SlopReviewPlugin;

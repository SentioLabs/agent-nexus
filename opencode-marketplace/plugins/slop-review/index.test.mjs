import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import SlopReviewPlugin, { SlopReviewPlugin as NamedSlopReviewPlugin } from "./index.js";

const pluginRoot = path.dirname(fileURLToPath(import.meta.url));

test("exports the official OpenCode slop-review plugin as default and named export", () => {
  assert.equal(SlopReviewPlugin, NamedSlopReviewPlugin);
  assert.equal(typeof SlopReviewPlugin, "function");
});

test("package metadata is safe for npm provenance", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));

  assert.equal(packageJson.name, "@sentiolabs/opencode-slop-review");
  assert.deepEqual(packageJson.repository, {
    type: "git",
    url: "https://github.com/SentioLabs/agent-nexus",
    directory: "opencode-marketplace/plugins/slop-review",
  });
  assert.deepEqual(packageJson.files, [
    "index.js",
    "commands",
    "skills",
    "README.md",
    "CHANGELOG.md",
    "version.txt",
  ]);
});

test("README documents npm plugin install while preserving repository installer path", () => {
  const readme = fs.readFileSync(path.join(pluginRoot, "README.md"), "utf8");

  assert.match(readme, /```json\n\{\n  "plugin": \["@sentiolabs\/opencode-slop-review"\]\n\}\n```/);
  assert.match(
    readme,
    /https:\/\/raw\.githubusercontent\.com\/sentiolabs\/agent-nexus\/main\/\.opencode\/INSTALL\.md/,
  );
});

test("config hook registers bundled command from markdown and appends skills path", async () => {
  const plugin = await SlopReviewPlugin({});
  const config = {};

  await plugin.config(config);

  assert.equal(
    config.command["slop-review-review"].description,
    "Run an AI slop review on files, directories, PRs, or current changes",
  );
  assert.match(config.command["slop-review-review"].template, /Load the `ai-slop-review` skill/);
  assert.deepEqual(config.skills.paths, [path.join(pluginRoot, "skills")]);
});

test("config hook preserves existing user commands and skill paths without duplicates", async () => {
  const plugin = await SlopReviewPlugin({});
  const skillsPath = path.join(pluginRoot, "skills");
  const config = {
    command: {
      "slop-review-review": { description: "User command", template: "custom" },
      custom: { description: "Keep me", template: "existing" },
    },
    skills: {
      paths: ["/already/configured", skillsPath],
    },
  };

  await plugin.config(config);

  assert.equal(config.command["slop-review-review"].template, "custom");
  assert.equal(config.command.custom.template, "existing");
  assert.deepEqual(config.skills.paths, ["/already/configured", skillsPath]);
});

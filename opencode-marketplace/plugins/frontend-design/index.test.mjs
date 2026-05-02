import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import FrontendDesignPlugin, {
  FrontendDesignPlugin as NamedFrontendDesignPlugin,
} from "./index.js";

const pluginRoot = path.dirname(fileURLToPath(import.meta.url));

test("exports the official OpenCode plugin as default and named export", () => {
  assert.equal(FrontendDesignPlugin, NamedFrontendDesignPlugin);
  assert.equal(typeof FrontendDesignPlugin, "function");
});

test("package metadata matches the GitHub repository for npm provenance", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));

  assert.equal(packageJson.name, "@sentiolabs/opencode-frontend-design");
  assert.deepEqual(packageJson.repository, {
    type: "git",
    url: "https://github.com/SentioLabs/agent-nexus",
    directory: "opencode-marketplace/plugins/frontend-design",
  });
});

test("package files include runtime assets, docs, and version marker", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));

  assert.deepEqual(packageJson.files, [
    "index.js",
    "skills",
    "README.md",
    "CHANGELOG.md",
    "LICENSE",
    "version.txt",
  ]);
});

test("config hook adds bundled frontend-design skills path", async () => {
  const plugin = await FrontendDesignPlugin({});
  const config = {};

  await plugin.config(config);

  assert.deepEqual(config.skills.paths, [path.join(pluginRoot, "skills")]);
});

test("config hook preserves user skills paths and avoids duplicate bundled entries", async () => {
  const skillsPath = path.join(pluginRoot, "skills");
  const plugin = await FrontendDesignPlugin({});
  const config = {
    skills: {
      paths: ["/already/configured", skillsPath],
    },
  };

  await plugin.config(config);

  assert.deepEqual(config.skills.paths, ["/already/configured", skillsPath]);
});

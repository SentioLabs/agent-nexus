import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import ArcPlugin, { ArcPlugin as NamedArcPlugin } from "./index.js";

const pluginRoot = path.dirname(fileURLToPath(import.meta.url));

test("exports the official OpenCode plugin as default and named export", () => {
  assert.equal(ArcPlugin, NamedArcPlugin);
  assert.equal(typeof ArcPlugin, "function");
});

test("config hook registers bundled arc commands, agents, and skills", async () => {
  const plugin = await ArcPlugin({ $: async () => undefined });
  const config = {};

  await plugin.config(config);

  assert.equal(config.command["arc-onboard"].description, "Get oriented with the current project");
  assert.match(config.command["arc-onboard"].template, /Run `arc onboard`/);
  assert.equal(config.command["arc-plugin"].description, "Install and configure arc for OpenCode");

  assert.equal(config.agent["arc-implementer"].mode, "subagent");
  assert.match(config.agent["arc-implementer"].prompt, /NO PRODUCTION CODE WITHOUT FAILING TEST FIRST/);
  assert.deepEqual(config.agent["arc-implementer"].tools, {
    webfetch: false,
    task: false,
    todowrite: false,
  });
  assert.deepEqual(config.agent["arc-implementer"].permission, {
    webfetch: "deny",
  });

  assert.deepEqual(config.skills.paths, [path.join(pluginRoot, "skills")]);
});

test("config hook preserves existing user config while adding arc assets", async () => {
  const plugin = await ArcPlugin({ $: async () => undefined });
  const config = {
    command: {
      custom: { description: "Keep me", template: "existing" },
    },
    agent: {
      custom: { description: "Keep me", prompt: "existing" },
    },
    skills: {
      paths: ["/already/configured"],
    },
  };

  await plugin.config(config);

  assert.equal(config.command.custom.template, "existing");
  assert.equal(config.agent.custom.prompt, "existing");
  assert.deepEqual(config.skills.paths, ["/already/configured", path.join(pluginRoot, "skills")]);
});

test("event hook runs arc prime on session lifecycle events and fails open", async () => {
  const commands = [];
  const failingShell = (strings, ...values) => {
    commands.push(String.raw({ raw: strings }, ...values));
    throw new Error("arc is unavailable");
  };
  const plugin = await ArcPlugin({ $: failingShell });

  await plugin.event({ event: { type: "session.created" } });
  await plugin.event({ event: { type: "session.compacted" } });
  await plugin.event({ event: { type: "message.created" } });

  assert.deepEqual(commands, ["arc prime", "arc prime"]);
});

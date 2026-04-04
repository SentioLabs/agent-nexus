# Worktrunk for Codex

This directory is a Codex-only packaging of Worktrunk's git worktree guidance. It is intended to feel native in the Codex marketplace while staying honest about which Claude-era behaviors do and do not translate cleanly.

## What is included

- Codex marketplace metadata for the `worktrunk` plugin
- A reference hook configuration using only documented Codex events
- A plugin-local entry point for the Worktrunk skill and reference docs
- Repo-local release registration so the plugin can be versioned alongside the rest of this marketplace

## Install in Codex

1. Make sure this repo's `.agents/plugins/marketplace.json` is available to Codex.
2. Install or enable the `worktrunk` plugin from the Sentio Labs marketplace entry.
3. Refresh Codex if the plugin does not appear immediately after registration.

Use the Codex marketplace path for installation and configuration here. Do not follow Claude-specific install commands in this package.

## Hook status

Codex hooks are experimental. This scaffold uses only the documented `SessionStart`, `UserPromptSubmit`, and `Stop` events.

The repository includes a reference `hooks.json` you can adapt manually into `~/.codex/hooks.json` or `<repo>/.codex/hooks.json` if you want to experiment with marker automation. Local validation on April 3, 2026 enabled `codex_hooks`, linked this plugin into a local Codex plugin directory, and ran `codex exec` in this repository, but no Worktrunk marker transition was observed during or after the run.

If you already have a hooks file, merge the sample into it rather than replacing unrelated Codex hooks. That means plugin installation alone does not currently enable marker updates here. Treat the hook JSON as a manual/reference configuration, not a guaranteed installed capability.

## Attribution

Worktrunk is authored by Max Rozen / worktrunk.dev. This Codex packaging follows the upstream Worktrunk repository while adapting the plugin surface for this marketplace.

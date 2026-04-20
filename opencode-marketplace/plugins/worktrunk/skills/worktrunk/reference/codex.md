# Codex Integration

The Worktrunk Codex plugin provides one bundled skill package and one reference hook configuration:

1. **Configuration skill** — Worktrunk documentation Codex can use to help set up commit generation, hooks, and troubleshooting
2. **Reference marker configuration** — optional marker updates in `wt list` if you copy the hook JSON into a Codex hook location and the runtime loads it

## Installation

Install or enable the `worktrunk` entry from this repository's Codex marketplace catalog:

- make sure this repo's `.agents/plugins/marketplace.json` catalog is available to Codex
- enable the `worktrunk` plugin from the local marketplace flow for this repo
- refresh Codex if the skill does not appear immediately after installation

This port intentionally avoids Claude-only install commands, and it does not invent a `codex plugin install ...` CLI flow that has not been validated here.
The repository also includes a reference `hooks.json` file, but plugin installation alone does not currently enable marker updates here. Copy that file into `~/.codex/hooks.json` or `<repo>/.codex/hooks.json` if you want to experiment manually.
If you already have a hooks file, merge the sample into it rather than replacing unrelated Codex hooks.

## Configuration skill

The plugin bundles a Worktrunk skill under `skills/worktrunk/` so Codex can help with:

- setting up LLM-generated commit messages
- adding project hooks (`pre-start`, `pre-merge`, `pre-commit`, and related hook types)
- configuring worktree path templates and project defaults
- troubleshooting shell integration or Worktrunk configuration problems

Use the bundled docs the same way you would use any other Codex skill: ask for Worktrunk setup, hook design, or troubleshooting help in a repo where the plugin is installed.

## Activity tracking

This port includes a reference marker configuration that uses the documented Codex event subset only. Treat automatic marker updates as unconfirmed until a real Codex hook location loads the copied configuration:

- `SessionStart` with `startup|resume` clears stale marker state
- `UserPromptSubmit` sets `🤖`
- `Stop` sets `💬`

There is currently no documented Codex equivalent for Claude `Notification` or Claude `SessionEnd`, so this plugin does not claim lifecycle parity with the upstream Claude integration.

The intended result is best-effort branch markers in `wt list`:

```bash
$ wt list
  Branch          Status  HEAD+/-  main     Remote  Path                   Commit    Age  Message
@ main            ^⇡              ⇡1        .                        33323bc1  1d   Initial commit
+ feature-api     ↑      🤖       ↑1               ../repo.feature-api    70343f03  1d   Add REST API endpoints
+ review-ui       ? ↑    💬       ↑1               ../repo.review-ui      a585d6ed  1d   Add dashboard component
+ wip-docs        ? –                         ../repo.wip-docs       33323bc1  1d   Initial commit
```

- `🤖` means Codex is actively working on that branch
- `💬` means Codex most recently finished a turn and is waiting for input

Because Codex hook support is experimental, treat these markers as helpful defaults rather than guaranteed state transitions.

On April 3, 2026, local validation enabled `codex_hooks`, linked this plugin into a local Codex plugin directory, and ran `codex exec` in this repository. No marker transition was observed, so automatic tracking remains unconfirmed until a Codex hook location loads the copied configuration in a real install flow.

### Manual status markers

Set status markers manually for any workflow:

```bash
$ wt config state marker set "🚧"                   # Current branch
$ wt config state marker set "✅" --branch feature  # Specific branch
$ git config worktrunk.state.feature.marker '{"marker":"💬","set_at":0}'  # Direct
```

## Statusline

This Codex port does not currently document or promise statusline integration. If a future Codex runtime exposes a validated statusline command surface for Worktrunk, document it separately after runtime testing proves it works.

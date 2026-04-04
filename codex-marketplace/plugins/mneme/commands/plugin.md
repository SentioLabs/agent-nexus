---
description: Install and configure mneme for Claude Code and Codex
---

# mneme docs plugin

Mneme supports both Claude Code and Codex through repo-local plugin packaging.

## Claude Code

- Install the Claude plugin from this repository's `claude-marketplace/plugins/mneme/.claude-plugin/` manifest.
- Claude packaging uses inline hooks in `plugin.json` for transparent tool interception and session events.

## Codex

- Install the Codex plugin from this repository's `.agents/plugins/marketplace.json` catalog.
- Codex packaging uses:
  - `codex-marketplace/plugins/mneme/.codex-plugin/plugin.json`
  - `codex-marketplace/plugins/mneme/hooks.json`
- For transparent routing to work reliably, Codex should connect to a running mneme daemon.

Recommended explicit hook transport:

```bash
mneme hook pretooluse --platform codex --server 127.0.0.1:7435
mneme hook sessionstart --platform codex --server 127.0.0.1:7435
```

## Compatibility note

Codex support in this repo targets feature parity: transparent context reduction, session memory recall, and conservative durable memory capture. It does not depend on one-to-one event parity with Claude.

## After installation

Run the setup flow from your project root:

```bash
mneme doctor --json
mneme stats --json
```

If `doctor` reports the server is not reachable, start the daemon:

```bash
mneme server start
```

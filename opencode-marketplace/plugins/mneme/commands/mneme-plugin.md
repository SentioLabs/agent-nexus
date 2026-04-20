---
description: Install and configure mneme for OpenCode
---

# mneme plugin

Mneme supports OpenCode in this repository through a local runtime plugin plus command and skill docs.

## OpenCode

- Install from this repository's OpenCode marketplace tree:
  - `opencode-marketplace/plugins/mneme/plugins/mneme.js`
  - `opencode-marketplace/plugins/mneme/commands/mneme-plugin.md`
  - `opencode-marketplace/plugins/mneme/commands/mneme-doctor.md`
  - `opencode-marketplace/plugins/mneme/commands/mneme-remember.md`
  - `opencode-marketplace/plugins/mneme/commands/mneme-setup.md`
  - `opencode-marketplace/plugins/mneme/commands/mneme-stats.md`
  - `opencode-marketplace/plugins/mneme/skills/mneme/SKILL.md`
- OpenCode packaging uses a local `.opencode/plugins/mneme.js` runtime plugin for transparent tool interception and session events.

Recommended explicit hook transport:

```bash
mneme hook pretooluse --platform opencode --server 127.0.0.1:7435
mneme hook sessionstart --platform opencode --server 127.0.0.1:7435
```

## Compatibility note

OpenCode support in this repo targets feature parity: transparent context reduction, session memory recall, and conservative durable memory capture. It does not depend on one-to-one event parity with other platforms.

## After installation

Restart OpenCode or start a fresh session so the new local plugin, commands, and skill load.

Then, from your project root, run:

```bash
mneme doctor --json
```

If `doctor` reports the server is not reachable, start the daemon:

```bash
mneme server start
```

Once the daemon is healthy, use the installed `/mneme-*` commands or the `mneme` skill.

The local runtime plugin is fail-open: if `mneme` is missing or a hook command fails, OpenCode tool and session flow continue without Mneme interception.

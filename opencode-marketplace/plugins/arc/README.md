# OpenCode Arc

Official npm-style OpenCode plugin package for `arc` workflow integration.

## Install

Add the package to your OpenCode config:

```json
{
  "plugin": ["@sentiolabs/opencode-arc"]
}
```

OpenCode installs plugin packages automatically with Bun. After enabling the plugin, run `arc onboard` in each project root to resolve the active Arc project and load current work context.

## Provided surfaces

- Fail-open `arc prime` automation on `session.created` and `session.compacted`.
- `/arc-*` commands registered from this package's bundled command markdown.
- `arc-*` helper agents registered from this package's bundled agent markdown.
- Arc workflow skills exposed through this package's bundled `skills/` directory.

The legacy copy-based installer can still install the same commands, agents, skills, and runtime hook from this directory for local development or environments that do not use package plugins yet.

## Target surfaces

- OpenCode web sessions
- OpenCode interactive CLI sessions
- Attached sessions for verification and testing (proof still pending)

## Testing-only target

- `opencode run` (proof still pending)

## Contract

- `arc prime` automation is fail-open; missing or unhealthy `arc` must not block OpenCode startup.
- OpenCode commands, agents, and skills remain explicitly prefixed with `arc`.
- The OpenCode workflow is sequential and subagent-driven.
- This plugin does not claim worktree-isolated parallel execution.

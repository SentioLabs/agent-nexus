# mneme for OpenCode

OpenCode port of the `mneme` plugin.

## Runtime Surface

- `plugins/mneme.js`
- `commands/mneme-*.md`
- `skills/mneme/SKILL.md`

## Notes

This port relies on OpenCode local plugin hooks instead of Codex `hooks.json`.

## Quickstart After Install

1. Restart OpenCode or start a fresh session so the new local plugin, commands, and skill load.
2. Run `mneme doctor --json`.
3. If the daemon is not reachable, start it with `mneme server start`.
4. Then use the installed `/mneme-*` commands or the `mneme` skill.

The runtime plugin is fail-open: if `mneme` is missing or the hook command fails, normal OpenCode tool execution continues without Mneme interception.

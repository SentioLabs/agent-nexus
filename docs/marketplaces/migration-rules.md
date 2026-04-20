# Marketplace Migration Rules

These rules keep the Claude, Codex, and OpenCode marketplace trees predictable while the
repo stays split by platform.

## Duplicate vs Diverge

- Duplicate by default when a plugin or document is still mostly the same across Claude,
  Codex, and OpenCode.
- Diverge intentionally when the runtime behavior, hooks, or interaction model is platform-specific.
- If a file starts collecting platform conditionals, stop sharing it and move the platform-specific copy into the relevant marketplace subtree.

## What Belongs In `shared/`

- Validation scripts
- Static assets
- Reference documents
- Other non-runtime support files

Do not put runtime `SKILL.md` files, plugin manifests, hooks, or commands in `shared/`. Those files need to live where the platform runtime resolves them.

For OpenCode, treat `.opencode/` runtime files and any `opencode.fragment.json` files as
runtime content too.

## Why Runtime Files Stay In Plugin Roots

Claude and Codex resolve plugin runtime content from the plugin tree itself. OpenCode is
installer-driven, but its source files still need to stay in the OpenCode plugin tree so the
installer can copy them into project-local `.opencode/` paths reliably.

To keep that resolution reliable:

- `SKILL.md` files and nested skill runtime support files belong under each plugin root
- plugin manifests belong under each plugin root
- platform-specific hooks and commands stay with the plugin they serve
- OpenCode local runtime plugin files stay under each plugin's `plugins/` directory so the
  installer can copy them into `.opencode/plugins/`
- OpenCode command and agent filenames should be plugin-prefixed because OpenCode's
  command and agent namespaces are flat after installation
- OpenCode skill names should be globally unique after installation too, so generic names
  should be renamed to plugin-prefixed names before they land in the marketplace

Reserve `opencode.fragment.json` for `opencode.json` fragments that cannot be expressed as
plain command, skill, agent, or local plugin files.

If a skill is meant to run in multiple platforms, keep a copy in each platform subtree rather than pointing across trees.

## Revalidation

Revalidate all affected platforms when a change touches:

- `shared/`
- root shim manifests
- `.opencode/INSTALL.md`
- release automation
- any plugin tree that is duplicated into both marketplaces

Revalidate OpenCode as well when a change touches `opencode-marketplace/` or the root
OpenCode install instructions.

Revalidate only the affected platform when a change is clearly isolated to one subtree and does not touch shared support files.

## Code Generation

Code generation is intentionally deferred. We will only introduce it if duplication becomes a proven maintenance problem.

Until then, prefer explicit platform-specific copies so divergence is visible and easy to review.

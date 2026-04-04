# Marketplace Migration Rules

These rules keep the Claude and Codex marketplace trees predictable while the repo stays split by platform.

## Duplicate vs Diverge

- Duplicate by default when a plugin or document is still mostly the same across Claude and Codex.
- Diverge intentionally when the runtime behavior, hooks, or interaction model is platform-specific.
- If a file starts collecting platform conditionals, stop sharing it and move the platform-specific copy into the relevant marketplace subtree.

## What Belongs In `shared/`

- Validation scripts
- Static assets
- Reference documents
- Other non-runtime support files

Do not put runtime `SKILL.md` files, plugin manifests, hooks, or commands in `shared/`. Those files need to live where the platform runtime resolves them.

## Why `SKILL.md` Stays In Plugin Roots

Claude and Codex resolve plugin runtime content from the plugin tree itself. To keep that resolution reliable:

- `SKILL.md` files belong under each plugin root
- plugin manifests belong under each plugin root
- platform-specific hooks and commands stay with the plugin they serve

If a skill is meant to run in both platforms, keep a copy in each platform subtree rather than pointing across trees.

## Revalidation

Revalidate both platforms when a change touches:

- `shared/`
- root shim manifests
- release automation
- any plugin tree that is duplicated into both marketplaces

Revalidate only the affected platform when a change is clearly isolated to one subtree and does not touch shared support files.

## Code Generation

Code generation is intentionally deferred. We will only introduce it if duplication becomes a proven maintenance problem.

Until then, prefer explicit platform-specific copies so divergence is visible and easy to review.

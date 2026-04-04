---
description: Store a memory in mneme — use when you learn a preference, knowledge, or decision worth remembering
allowed-tools: Bash
user-invocable: true
---

# mneme remember

Store a memory in mneme's searchable memory system. Use this whenever you learn something worth remembering — preferences, knowledge, decisions — from the conversation.

## When to use

- The user states a preference ("always use X", "never do Y", "use bun not npm")
- You learn project knowledge ("this project uses stoolap for storage", "CI runs on Blacksmith")
- A decision is made ("we chose Catppuccin Mocha for dark theme", "memory feedback is idempotent")
- The user explicitly asks you to remember something

## Instructions

Determine the appropriate type and content, then run:

```bash
mneme memory add "<content>" -t <preference|knowledge|decision>
```

Memories are **automatically scoped** to the current project based on your working directory. The mneme server resolves your CWD against registered paths to determine the scope. No `--project` or `--scope` flags are needed.

To store a **global** memory (applies across all projects), add `--scope-global`:

```bash
mneme memory add "<content>" -t <preference|knowledge|decision> --scope-global
```

### Type mapping

| Signal | Type |
|--------|------|
| "always", "never", "prefer", "use X not Y", "I like", "don't" | `preference` |
| Facts, how things work, architecture, tooling, conventions | `knowledge` |
| "we decided", "the approach is", trade-off resolutions | `decision` |

### Scope behavior

| Scenario | What happens |
|----------|-------------|
| Running from a project directory | Memory auto-scoped to the closest registered path |
| `--scope-global` flag used | Memory stored as global (no path association) |
| CWD has no registered ancestor path | Memory stored as global |

### Content guidelines

- Write the memory as a clear, self-contained statement
- Include enough context that it's useful without the conversation
- Don't include ephemeral details (timestamps, session IDs, file paths that may change)
- Keep it under 200 characters when possible

## Example

User says: "this project uses bun exclusively, use bun/bunx instead of npm/npx"

```bash
mneme memory add "This project uses bun exclusively as its JavaScript runtime. Always use bun/bunx instead of npm/npx." -t preference
```

User says: "always use rg instead of grep" (applies everywhere):

```bash
mneme memory add "Prefer using rg (ripgrep) instead of grep for faster searches" -t preference --scope-global
```

## Important

This command stores in mneme's memory system — searchable, scoreable, and visible in the web UI. This is **in addition to** Claude Code's built-in auto-memory (file-based). Both should be used: auto-memory for Claude's own context, mneme for the shared knowledge base.

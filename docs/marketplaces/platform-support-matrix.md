# Marketplace Platform Support Matrix

## Evidence Sources

- `codex --help` (`codex-cli 0.121.0`)
- `codex marketplace --help`
- `codex mcp --help`
- `opencode --help` (`1.14.19`)
- `opencode plugin --help`
- `opencode agent --help`
- `opencode mcp --help`
- `https://opencode.ai/docs/plugins/`
- `https://opencode.ai/docs/commands/`
- `https://opencode.ai/docs/skills/`
- `https://opencode.ai/docs/agents/`
- `https://opencode.ai/docs/mcp-servers/`
- `.opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts`

## Capability Matrix

| Capability | Codex | OpenCode | Evidence | Repo impact |
| --- | --- | --- | --- | --- |
| Marketplace registration | supported | package-based install via `plugin` is supported, but this repo does not yet ship a bootstrap package | CLI help | keep `.opencode/INSTALL.md` until bootstrap package exists |
| Markdown commands | supported in plugin tree | supported in `.opencode/commands/` | docs + repo layout | keep prefixed filenames |
| Markdown agents | supported in plugin tree | supported in `.opencode/agents/` | docs + CLI help | keep prefixed filenames |
| Markdown skills | supported in plugin tree | supported in `.opencode/skills/<name>/SKILL.md` | docs | enforce globally unique skill names |
| Local JS/TS hook plugins | plugin hooks.json | supported in `.opencode/plugins/*.js|ts` | plugin docs + runtime types | supports hook-backed OpenCode ports such as `mneme`; this capability alone does not make `arc` shippable while its other blockers remain |
| Tool pre-execute hook | `PreToolUse` hook matcher | supported via `tool.execute.before` | runtime types | enables transparent pre-tool routing for `mneme` |
| Tool post-execute hook | `PostToolUse` hook matcher | supported via `tool.execute.after` | runtime types | enables transparent post-tool routing for `mneme` |
| Session lifecycle events | `SessionStart` / `PreCompact` / stop hooks | supported via plugin `event` callback and `session.created` / `session.compacted` / `session.idle` events | runtime types | supports `mneme` session lifecycle hooks without per-session setup |
| MCP config | `.mcp.json` | supported in `opencode.json.mcp` | CLI help + docs | makes `atlassian` a candidate once config-fragment merge behavior is documented and clean in this repo |

## Plugin Outcomes

| Plugin | Outcome | Reason |
| --- | --- | --- |
| `slop-review` | refresh only | pilot already exists; docs and install surface must match current OpenCode model |
| `worktrunk` | port now | skill-only payload, unique skill name, no config dependency |
| `atlassian` | port now | documented `opencode.fragment.json` merge contract exists in this repo and cleanly carries the remote Atlassian MCP config into `opencode.json` |
| `mneme` | port now | local `.opencode/plugins/mneme.js` can transparently observe routed tools through `tool.execute.before` / `tool.execute.after` and react to session lifecycle events |
| `arc` | defer with blockers | OpenCode supports local JS plugins and namespaced skills, but the current `arc` skill corpus still depends on unsupported workflow primitives such as `TaskCreate`, `AskUserQuestion`, `Agent`/`Task` tool dispatch, `subagent_type`, `isolation: "worktree"`, and `/arc:*` invocations, so shipping the current port would misrepresent the reduced runtime model |

## Claude Arc Cherry-Pick Candidates

| File | Decision | Notes |
| --- | --- | --- |
| `claude-marketplace/plugins/arc/skills/plan/SKILL.md` | adopt with adaptation | keep Codex evaluator workflow, adopt anti-placeholder/self-review tightening |
| `claude-marketplace/plugins/arc/skills/implement/SKILL.md` | adopt with adaptation | keep Codex evaluator+review flow, add stronger context/scope wording |
| `claude-marketplace/plugins/arc/skills/review/SKILL.md` | adopt | align reviewer/evaluator boundary |
| `claude-marketplace/plugins/arc/skills/brainstorm/SKILL.md` | adopt | add efficient exploration guidance |
| `claude-marketplace/plugins/arc/skills/arc/SKILL.md` | adopt | align installation wording |
| `claude-marketplace/plugins/arc/agents/arc-implementer.md` | review manually before adoption | do not blindly replace Codex agent behavior |

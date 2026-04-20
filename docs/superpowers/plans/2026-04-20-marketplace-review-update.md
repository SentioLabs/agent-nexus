# Marketplace Review and Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit current Codex and OpenCode marketplace capabilities, refresh stale marketplace runtime/docs/validators, cherry-pick worthwhile Claude `arc` tightenings into Codex, and expand OpenCode with the cleanest supported plugin ports.

**Architecture:** Build one evidence-backed support matrix first, then use it to drive deterministic plugin outcomes. Treat `claude-marketplace/plugins/arc/` as an upstream review source for runtime wording/tightening, keep Codex-specific behavior where it intentionally diverges, and extend OpenCode's installer/validator model to cover markdown runtime files, local `.opencode/plugins/*.js` hook plugins, and optional `opencode.fragment.json` config merges.

**Tech Stack:** Markdown docs, JSON manifests, Markdown commands/skills/agents, local OpenCode JS plugins, Node.js validation scripts, Codex CLI, OpenCode CLI.

---

## File Map

- `docs/marketplaces/platform-support-matrix.md`
  Responsibility: single source of truth for audited Codex/OpenCode capabilities, plugin outcomes, and Claude `arc` cherry-pick decisions.
- `docs/marketplaces/opencode-roadmap.md`
  Responsibility: staged OpenCode rollout status after the audit.
- `docs/marketplaces/migration-rules.md`
  Responsibility: repo rules for OpenCode local JS plugins, skill namespacing, and config fragments.
- `README.md`
  Responsibility: root entrypoint links and current marketplace support summary.
- `codex-marketplace/plugins/arc/skills/{plan,implement,review,brainstorm,arc}/SKILL.md`
  Responsibility: Codex `arc` runtime behavior that may need Claude-derived tightening.
- `codex-marketplace/plugins/arc/commands/docs.md`
  Responsibility: Codex `arc docs` installation wording.
- `codex-marketplace/plugins/arc/CHANGELOG.md`
  Responsibility: record Codex `arc` sync changes.
- `opencode-marketplace/README.md`
  Responsibility: OpenCode marketplace layout rules, including local plugin JS files and flat namespaces.
- `opencode-marketplace/scripts/validate-opencode-marketplace.mjs`
  Responsibility: validate OpenCode plugin layout, namespace safety, JS plugin files, and `.opencode/INSTALL.md` coverage.
- `.opencode/INSTALL.md`
  Responsibility: install contract for every supported OpenCode plugin file and config merge.
- `opencode-marketplace/plugins/slop-review/README.md`
  Responsibility: refreshed pilot-plugin docs after the new OpenCode conventions.
- `opencode-marketplace/plugins/worktrunk/**`
  Responsibility: skill-only OpenCode port of Worktrunk guidance.
- `opencode-marketplace/plugins/atlassian/**`
  Responsibility: OpenCode MCP-backed skill port using `opencode.fragment.json`.
- `opencode-marketplace/plugins/mneme/**`
  Responsibility: OpenCode command/skill port plus local JS hook plugin.
- `opencode-marketplace/plugins/arc/**`
  Responsibility: conditional OpenCode `arc` port with namespaced skills, prefixed commands/agents, and degraded priming-only JS hook plugin.

## Decision Gates

These gates control the conditional tasks later in the plan.

1. `mneme` may ship only if the support matrix records OpenCode local JS plugins and `tool.execute.before` / `tool.execute.after` hooks as `supported`.
2. `arc` may ship only if all of the following are true:
   - OpenCode local JS plugins are `supported`
   - the validator enforces globally unique OpenCode skill names
   - the reduced OpenCode `arc` runtime is acceptable with `session.created` / `session.compacted` priming only
   - the copied command/skill/agent surface stays maintainable after renaming
3. `atlassian` may ship only if the support matrix records OpenCode `mcp` config as `supported` and `opencode.fragment.json` merge rules are documented in `.opencode/INSTALL.md`.

### Task 1: Build the Capability Matrix and Outcome Ledger

**Files:**
- Create: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`
- Modify: `README.md`

- [ ] **Step 1: Create the support matrix file with the exact evidence sources section**

```md
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
| Marketplace registration | supported | npm-only via `plugin`, local manual install still required | CLI help | keep `.opencode/INSTALL.md` until bootstrap package exists |
| Markdown commands | supported in plugin tree | supported in `.opencode/commands/` | docs + repo layout | keep prefixed filenames |
| Markdown agents | supported in plugin tree | supported in `.opencode/agents/` | docs + CLI help | keep prefixed filenames |
| Markdown skills | supported in plugin tree | supported in `.opencode/skills/<name>/SKILL.md` | docs | enforce globally unique skill names |
| Local JS/TS hook plugins | plugin hooks.json | supported in `.opencode/plugins/*.js|ts` | plugin docs + runtime types | unlock `mneme` and reduced `arc` |
| MCP config | `.mcp.json` | supported in `opencode.json.mcp` | CLI help + docs | unlock `atlassian` via config fragment |
```

- [ ] **Step 2: Add the plugin outcome ledger directly below the matrix**

```md
## Plugin Outcomes

| Plugin | Outcome | Reason |
| --- | --- | --- |
| `slop-review` | refresh only | pilot already exists; docs and install surface must match current OpenCode model |
| `worktrunk` | port now | skill-only payload, unique skill name, no config dependency |
| `atlassian` | conditional port | OpenCode now supports `mcp` config; depends on documented fragment merge |
| `mneme` | conditional port | depends on OpenCode local JS plugin hooks for transparent routing |
| `arc` | conditional port | depends on OpenCode local JS plugins, namespaced skill renames, and acceptable degraded priming |

## Claude Arc Cherry-Pick Candidates

| File | Decision | Notes |
| --- | --- | --- |
| `claude-marketplace/plugins/arc/skills/plan/SKILL.md` | adopt with adaptation | keep Codex evaluator workflow, adopt anti-placeholder/self-review tightening |
| `claude-marketplace/plugins/arc/skills/implement/SKILL.md` | adopt with adaptation | keep Codex evaluator+review flow, add stronger context/scope wording |
| `claude-marketplace/plugins/arc/skills/review/SKILL.md` | adopt | align reviewer/evaluator boundary |
| `claude-marketplace/plugins/arc/skills/brainstorm/SKILL.md` | adopt | add efficient exploration guidance |
| `claude-marketplace/plugins/arc/skills/arc/SKILL.md` | adopt | align installation wording |
| `claude-marketplace/plugins/arc/agents/arc-implementer.md` | review manually before adoption | do not blindly replace Codex agent behavior |
```

- [ ] **Step 3: Update the OpenCode roadmap to reflect the audited capability model**

```md
## Phase 2

Goal: prove OpenCode's mixed runtime model using markdown commands/skills plus local `.opencode/plugins/*.js` hook plugins and optional `opencode.json` fragment merges.

Included:

- port `worktrunk`
- port `atlassian` if `mcp` fragment merge is clean
- port `mneme` if local JS hook plugins are sufficient
- define the OpenCode skill namespacing rule for globally unique skill names
- document why `opencode plugin <module>` does not yet replace `.opencode/INSTALL.md`
```

- [ ] **Step 4: Add the support matrix link to the root README**

```md
- [Platform Support Matrix](docs/marketplaces/platform-support-matrix.md)
```

- [ ] **Step 5: Verify the support matrix contains every in-scope plugin and every gate status**

Run: `rg -n "slop-review|worktrunk|atlassian|mneme|arc|supported|conditional port|refresh only" docs/marketplaces/platform-support-matrix.md`

Expected: matches for all five plugin names and the outcome labels above.

- [ ] **Step 6: Commit the audit baseline**

```bash
git add docs/marketplaces/platform-support-matrix.md docs/marketplaces/opencode-roadmap.md README.md
git commit -m "docs: record marketplace support matrix"
```

### Task 2: Review Claude Arc Tightenings and Sync Safe Changes into Codex Arc

**Files:**
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `codex-marketplace/plugins/arc/skills/plan/SKILL.md`
- Modify: `codex-marketplace/plugins/arc/skills/implement/SKILL.md`
- Modify: `codex-marketplace/plugins/arc/skills/review/SKILL.md`
- Modify: `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
- Modify: `codex-marketplace/plugins/arc/skills/arc/SKILL.md`
- Modify: `codex-marketplace/plugins/arc/commands/docs.md`
- Modify: `codex-marketplace/plugins/arc/CHANGELOG.md`

- [ ] **Step 1: Run focused Claude-vs-Codex diffs and confirm the decision table before editing**

Run: `git diff --no-index -- claude-marketplace/plugins/arc/skills/plan/SKILL.md codex-marketplace/plugins/arc/skills/plan/SKILL.md && git diff --no-index -- claude-marketplace/plugins/arc/skills/implement/SKILL.md codex-marketplace/plugins/arc/skills/implement/SKILL.md && git diff --no-index -- claude-marketplace/plugins/arc/skills/review/SKILL.md codex-marketplace/plugins/arc/skills/review/SKILL.md`

Expected: visible diffs showing the Claude-only anti-placeholder, self-review, context/scope, and reviewer/evaluator wording.

- [ ] **Step 2: Add the Claude anti-placeholder and self-review sections to the Codex `plan` skill without removing Codex-specific evaluator wording**

```md
## No Placeholders

Every step in a task description must contain the actual content an implementer needs. These are **plan failures** — never write them:

- `"Add appropriate error handling"` / `"add validation"` / `"handle edge cases"` — show the actual code
- `"Write tests for the above"` without test code — include the test code
- `"Similar to Task N"` — repeat the content; the implementer has zero context of other tasks
- Steps that describe what to do without showing how — code blocks required for code steps
- References to types, functions, or methods not defined in any task or already on HEAD
- `"TBD"`, `"TODO"`, `"implement later"`, `"fill in details"`

Code blocks represent the **intent, structure, and behavior** — not a character-for-character mandate.
```

```md
### 6.5. Self-Review

After writing all tasks, review the plan against the design before proceeding:

1. **Spec coverage:** Skim each section/requirement in the design. Can you point to a task that implements it?
2. **Placeholder scan:** Search all task descriptions for red flags from the No Placeholders list.
3. **Type consistency:** Do later tasks use the same names/signatures defined earlier?
4. **Step completeness:** Every code step has a code block. Every command step has the exact command and expected output.
```

- [ ] **Step 3: Tighten the Codex `implement` skill by inserting Claude's context and scope rules, but keep the Codex evaluator+review parallel workflow**

```md
## Context
State the parent epic, completed prerequisite tasks, and any shared files or types that are already on HEAD.

## Project Test Command
State the exact repository test command, for example `make test` or `go test ./...`.

## Scope Rules
- Build ONLY what the task specifies. Follow code blocks' structure and behavior, adapted to project conventions.
- Do NOT add features, flags, helpers, or improvements not in the task.
- Do NOT modify files outside the `## Files` section.
- If a prerequisite is missing (type, file, dependency not on HEAD), report `NEEDS_CONTEXT`.
- If you notice non-blocking issues outside your scope, report `DONE_WITH_CONCERNS`.
- If a step is vague, report `NEEDS_CONTEXT` — do not fill in gaps with your judgment.
```

```md
**If `NEEDS_CONTEXT`** (implementer hit ambiguity or missing prerequisite):
- Read the `## Context Needed` section
- If the issue is a missing prerequisite, fix dependency ordering or provide the missing definition before re-dispatching

**If `DONE_WITH_CONCERNS`** (work complete, non-blocking observations):
- Read the `## Concerns` section
- Note adjacent code issues on the epic, then continue to evaluator/reviewer dispatch
```

- [ ] **Step 4: Align the Codex `review`, `brainstorm`, `arc`, and `docs` command wording with Claude where the behavior is platform-neutral**

```md
When dispatched from the `implement` skill, the reviewer runs **in parallel** with the `arc-evaluator`. Their concerns are complementary, not overlapping.
```

```md
**Efficient codebase exploration:** Prefer higher-level tools over raw text search to minimize exploration rounds:

1. **Semantic search** (ck-search or equivalent)
2. **Symbol-level navigation** (Serena or equivalent)
3. **Grep/Glob** for exact symbol lookups
```

```md
| `arc docs plugin` | Claude Code and Codex installation guide |
```

- [ ] **Step 5: Record the Codex arc sync in the changelog**

```md
## [0.7.1] - 2026-04-20

### Fixes

- sync Claude `arc` planning/review wording into the Codex `arc` runtime where the behavior is platform-neutral
- tighten Codex `arc` task planning to reject placeholder task descriptions
```

- [ ] **Step 6: Run Codex marketplace validation**

Run: `node codex-marketplace/scripts/validate-codex-marketplace.mjs`

Expected: `Codex marketplace validation passed.`

- [ ] **Step 7: Commit the Codex arc sync**

```bash
git add docs/marketplaces/platform-support-matrix.md codex-marketplace/plugins/arc/skills/plan/SKILL.md codex-marketplace/plugins/arc/skills/implement/SKILL.md codex-marketplace/plugins/arc/skills/review/SKILL.md codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md codex-marketplace/plugins/arc/skills/arc/SKILL.md codex-marketplace/plugins/arc/commands/docs.md codex-marketplace/plugins/arc/CHANGELOG.md
git commit -m "fix(arc): sync codex workflow guidance with claude tightenings"
```

### Task 3: Define the OpenCode Runtime Conventions, Validator Rules, and Installer Contract

**Files:**
- Modify: `opencode-marketplace/README.md`
- Modify: `opencode-marketplace/scripts/validate-opencode-marketplace.mjs`
- Modify: `docs/marketplaces/migration-rules.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `opencode-marketplace/plugins/slop-review/README.md`

- [ ] **Step 1: Add the local plugin JS, skill uniqueness, and config fragment rules to `opencode-marketplace/README.md`**

```md
## Layout Rules

- Keep runtime files inside `opencode-marketplace/plugins/<plugin>/`
- Prefix OpenCode command filenames with the plugin name, for example `slop-review-review.md`
- Prefix OpenCode agent filenames with the plugin name for the same reason
- Treat OpenCode skill names as globally unique after installation; if a plugin has generic names such as `plan` or `review`, rename them to plugin-prefixed names such as `arc-plan` and `arc-review`
- Store local OpenCode hook/runtime plugins under `opencode-marketplace/plugins/<plugin>/plugins/` and copy them into `.opencode/plugins/`
- Reserve `opencode.fragment.json` for `opencode.json` merges that cannot live in plain command, skill, agent, or local plugin files
```

- [ ] **Step 2: Extend the OpenCode validator to reject duplicate flat namespaces and validate local JS plugin files**

```js
const seenSkillNames = new Map();
const seenCommandNames = new Map();
const seenAgentNames = new Map();

function rememberFlatName(map, name, owner, kind) {
  const previous = map.get(name);
  if (previous) {
    errors.push(`${kind} name '${name}' is duplicated by ${previous} and ${owner}`);
    return;
  }
  map.set(name, owner);
}

function validateRuntimePluginFiles(rootDir, pluginName) {
  if (!fs.existsSync(rootDir)) return;
  for (const fullPath of walkFiles(rootDir)) {
    const ext = path.extname(fullPath);
    if (!new Set([".js", ".mjs", ".ts"]).has(ext)) {
      errors.push(`${path.relative(repoRoot, fullPath)} must be a .js, .mjs, or .ts OpenCode plugin file`);
      continue;
    }
    if (!path.basename(fullPath).startsWith(`${pluginName}.`)) {
      errors.push(`${path.relative(repoRoot, fullPath)} must start with '${pluginName}.' so installed plugin filenames stay unique`);
    }
  }
}
```

```js
const installDoc = fs.readFileSync(installDocPath, "utf8");
for (const pluginName of pluginDirs) {
  if (!installDoc.includes(`- \`${pluginName}\``)) {
    errors.push(`.opencode/INSTALL.md is missing plugin selection '${pluginName}'`);
  }
  if (!installDoc.includes(`### ${pluginName}`)) {
    errors.push(`.opencode/INSTALL.md is missing a file mapping section for '${pluginName}'`);
  }
}
```

- [ ] **Step 3: Document the `.opencode/INSTALL.md` merge contract for local plugin JS files and `opencode.fragment.json`**

```md
## Install Behavior

9. If a selected plugin includes files under `plugins/`, copy them into `.opencode/plugins/` (or `~/.config/opencode/plugins/`) using the same filename.
10. If a selected plugin includes `opencode.fragment.json`, merge its top-level `opencode` object into the target `opencode.json` file. If the target file does not exist, create it with the fragment content.
11. Never silently overwrite conflicting `opencode.json` keys; show the conflict and ask first.
```

```json
{
  "opencode": {
    "mcp": {
      "atlassian": {
        "type": "remote",
        "url": "https://mcp.atlassian.com/v1/mcp",
        "enabled": true
      }
    }
  }
}
```

- [ ] **Step 4: Refresh the `slop-review` README so it points at the support matrix and new OpenCode conventions**

```md
## OpenCode Surface

- Skill: `ai-slop-review`
- Command: `/slop-review-review`

See `docs/marketplaces/platform-support-matrix.md` for the current support model and install constraints.
```

- [ ] **Step 5: Run OpenCode marketplace validation after the convention changes**

Run: `node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`

Expected: `OpenCode marketplace validation passed.`

- [ ] **Step 6: Commit the OpenCode foundation changes**

```bash
git add opencode-marketplace/README.md opencode-marketplace/scripts/validate-opencode-marketplace.mjs docs/marketplaces/migration-rules.md .opencode/INSTALL.md opencode-marketplace/plugins/slop-review/README.md
git commit -m "feat(opencode): define plugin runtime and install conventions"
```

### Task 4: Port Worktrunk to OpenCode

**Files:**
- Create: `opencode-marketplace/plugins/worktrunk/README.md`
- Create: `opencode-marketplace/plugins/worktrunk/CHANGELOG.md`
- Create: `opencode-marketplace/plugins/worktrunk/version.txt`
- Create: `opencode-marketplace/plugins/worktrunk/skills/worktrunk/SKILL.md`
- Create: `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/{config,hook,list,llm-commits,remove,shell-integration,step,switch,merge,faq,codex,tips-patterns,troubleshooting,worktrunk}.md`
- Modify: `.opencode/INSTALL.md`

- [ ] **Step 1: Add `worktrunk` to the supported plugin list and install mapping**

```md
## Supported Plugins

- `slop-review`: installs the `ai-slop-review` skill and the `/slop-review-review` command
- `worktrunk`: installs the `worktrunk` skill and its reference docs
```

```md
### worktrunk

Source plugin root:

- Local: `opencode-marketplace/plugins/worktrunk/`
- Remote: `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/`

Create these relative paths under the selected target root:

- `skills/worktrunk/SKILL.md`
- `skills/worktrunk/reference/config.md`
- `skills/worktrunk/reference/hook.md`
- `skills/worktrunk/reference/list.md`
- `skills/worktrunk/reference/llm-commits.md`
- `skills/worktrunk/reference/remove.md`
- `skills/worktrunk/reference/shell-integration.md`
- `skills/worktrunk/reference/step.md`
- `skills/worktrunk/reference/switch.md`
- `skills/worktrunk/reference/merge.md`
- `skills/worktrunk/reference/faq.md`
- `skills/worktrunk/reference/codex.md`
- `skills/worktrunk/reference/tips-patterns.md`
- `skills/worktrunk/reference/troubleshooting.md`
- `skills/worktrunk/reference/worktrunk.md`
```

- [ ] **Step 2: Create the Worktrunk metadata files**

```text
# opencode-marketplace/plugins/worktrunk/version.txt
0.2.0
```

```md
# opencode-marketplace/plugins/worktrunk/CHANGELOG.md

## 0.2.0

- Initial OpenCode marketplace port for `worktrunk`
```

````md
# Worktrunk for OpenCode

OpenCode port of the `worktrunk` plugin.

## Included Runtime Files

- `skills/worktrunk/SKILL.md`
- `skills/worktrunk/reference/`

## Install

Use the repository install entrypoint:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/.opencode/INSTALL.md
```
````

- [ ] **Step 3: Copy the Worktrunk skill and reference docs from the Codex source tree**

```text
Copy verbatim from:
- codex-marketplace/plugins/worktrunk/skills/worktrunk/SKILL.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/config.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/hook.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/list.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/llm-commits.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/remove.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/shell-integration.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/step.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/switch.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/merge.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/faq.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/codex.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/tips-patterns.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/troubleshooting.md
- codex-marketplace/plugins/worktrunk/skills/worktrunk/reference/worktrunk.md
```

- [ ] **Step 4: Run OpenCode marketplace validation for the new plugin**

Run: `node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`

Expected: `OpenCode marketplace validation passed.`

- [ ] **Step 5: Commit the Worktrunk port**

```bash
git add .opencode/INSTALL.md opencode-marketplace/plugins/worktrunk
git commit -m "feat(opencode): add worktrunk plugin port"
```

### Task 5: Port Atlassian to OpenCode If MCP Fragment Support Is Clean

**Files:**
- Create: `opencode-marketplace/plugins/atlassian/README.md`
- Create: `opencode-marketplace/plugins/atlassian/CHANGELOG.md`
- Create: `opencode-marketplace/plugins/atlassian/version.txt`
- Create: `opencode-marketplace/plugins/atlassian/opencode.fragment.json`
- Create: `opencode-marketplace/plugins/atlassian/skills/{capture-tasks-from-meeting-notes,generate-status-report,query-jira-work,search-company-knowledge,spec-to-backlog,triage-issue}/SKILL.md`
- Create: `opencode-marketplace/plugins/atlassian/skills/**/references/*.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`

- [ ] **Step 1: Gate Atlassian on the documented OpenCode `mcp` config row in the support matrix**

Run: `rg -n "MCP config|atlassian|conditional port" docs/marketplaces/platform-support-matrix.md`

Expected: a row showing OpenCode `mcp` config as `supported` and Atlassian marked `conditional port`.

- [ ] **Step 2: If the gate passes, create the config fragment with the exact remote MCP config**

```json
{
  "opencode": {
    "mcp": {
      "atlassian": {
        "type": "remote",
        "url": "https://mcp.atlassian.com/v1/mcp",
        "enabled": true
      }
    }
  }
}
```

- [ ] **Step 3: Create the Atlassian metadata files and copy the skill directories from the Codex plugin root**

```text
# opencode-marketplace/plugins/atlassian/version.txt
0.2.0
```

```md
# opencode-marketplace/plugins/atlassian/CHANGELOG.md

## 0.2.0

- Initial OpenCode marketplace port for `atlassian`
```

```md
# Work to copy verbatim from Codex

- `codex-marketplace/plugins/atlassian/skills/capture-tasks-from-meeting-notes/`
- `codex-marketplace/plugins/atlassian/skills/generate-status-report/`
- `codex-marketplace/plugins/atlassian/skills/query-jira-work/`
- `codex-marketplace/plugins/atlassian/skills/search-company-knowledge/`
- `codex-marketplace/plugins/atlassian/skills/spec-to-backlog/`
- `codex-marketplace/plugins/atlassian/skills/triage-issue/`
```

````md
# opencode-marketplace/plugins/atlassian/README.md

OpenCode port of the Atlassian MCP plugin.

## Runtime Surface

- `skills/`
- `opencode.fragment.json` source file, merged into target `opencode.json`

## Authentication

After installation, run:

```bash
opencode mcp auth atlassian
```
````

- [ ] **Step 4: Add the Atlassian install mapping to `.opencode/INSTALL.md`**

```md
### atlassian

Create these relative paths under the selected target root:

- `skills/capture-tasks-from-meeting-notes/SKILL.md`
- `skills/capture-tasks-from-meeting-notes/references/action-item-patterns.md`
- `skills/generate-status-report/SKILL.md`
- `skills/generate-status-report/references/jql-patterns.md`
- `skills/generate-status-report/references/report-templates.md`
- `skills/query-jira-work/SKILL.md`
- `skills/query-jira-work/references/query-examples.md`
- `skills/search-company-knowledge/SKILL.md`
- `skills/spec-to-backlog/SKILL.md`
- `skills/spec-to-backlog/references/breakdown-examples.md`
- `skills/spec-to-backlog/references/epic-templates.md`
- `skills/spec-to-backlog/references/ticket-writing-guide.md`
- `skills/triage-issue/SKILL.md`
- `skills/triage-issue/references/bug-report-templates.md`
- `skills/triage-issue/references/search-patterns.md`
- `opencode.json` (created or updated by merging `opencode-marketplace/plugins/atlassian/opencode.fragment.json`)
```

- [ ] **Step 5: If the gate fails, do not create the plugin tree; instead write the blocker exactly into the support matrix and roadmap**

```md
| `atlassian` | defer with blockers | OpenCode `mcp` fragment merge is not yet documented or reproducible enough to support repository-managed installation |
```

- [ ] **Step 6: Run validation and commit either the port or the blocker docs**

Run: `node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`

Expected: `OpenCode marketplace validation passed.`

```bash
git add .opencode/INSTALL.md docs/marketplaces/platform-support-matrix.md docs/marketplaces/opencode-roadmap.md opencode-marketplace/plugins/atlassian
git commit -m "feat(opencode): add atlassian plugin support"
```

### Task 6: Port Mneme to OpenCode If Local JS Hook Plugins Are Sufficient

**Files:**
- Create: `opencode-marketplace/plugins/mneme/README.md`
- Create: `opencode-marketplace/plugins/mneme/CHANGELOG.md`
- Create: `opencode-marketplace/plugins/mneme/version.txt`
- Create: `opencode-marketplace/plugins/mneme/plugins/mneme.js`
- Create: `opencode-marketplace/plugins/mneme/commands/{mneme-doctor,mneme-plugin,mneme-remember,mneme-setup,mneme-stats}.md`
- Create: `opencode-marketplace/plugins/mneme/skills/mneme/SKILL.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`

- [ ] **Step 1: Gate Mneme on OpenCode local JS plugin support and the hook rows in the support matrix**

Run: `rg -n "Local JS/TS hook plugins|tool.execute.before|tool.execute.after|mneme" docs/marketplaces/platform-support-matrix.md`

Expected: rows showing local JS plugins and tool hooks as `supported`.

- [ ] **Step 2: If the gate passes, create the local OpenCode hook plugin for Mneme**

```text
# opencode-marketplace/plugins/mneme/version.txt
0.10.0
```

```md
# opencode-marketplace/plugins/mneme/CHANGELOG.md

## 0.10.0

- Initial OpenCode marketplace port for `mneme`
```

```md
# opencode-marketplace/plugins/mneme/README.md

OpenCode port of the `mneme` plugin.

## Runtime Surface

- `plugins/mneme.js`
- `commands/mneme-*.md`
- `skills/mneme/SKILL.md`

## Notes

This port relies on OpenCode local plugin hooks instead of Codex `hooks.json`.
```

```js
export const MnemePlugin = async ({ $ }) => {
  const routedTools = new Set(["bash", "webfetch", "read", "grep"])

  return {
    "tool.execute.before": async (input) => {
      if (routedTools.has(input.tool)) {
        await $`mneme hook pretooluse --platform opencode --server 127.0.0.1:7435`
      }
    },
    "tool.execute.after": async (input) => {
      if (routedTools.has(input.tool)) {
        await $`mneme hook posttooluse --platform opencode --server 127.0.0.1:7435`
      }
    },
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await $`mneme hook sessionstart --platform opencode --server 127.0.0.1:7435`
      }
      if (event.type === "session.compacted") {
        await $`mneme hook precompact --platform opencode --server 127.0.0.1:7435`
      }
      if (event.type === "session.idle") {
        await $`mneme hook stop --platform opencode --server 127.0.0.1:7435`
      }
    },
  }
}

export default MnemePlugin
```

- [ ] **Step 3: Create the prefixed OpenCode commands and port the Mneme skill text**

```text
Copy these Codex command files and rename them:
- `commands/doctor.md` -> `commands/mneme-doctor.md`
- `commands/plugin.md` -> `commands/mneme-plugin.md`
- `commands/remember.md` -> `commands/mneme-remember.md`
- `commands/setup.md` -> `commands/mneme-setup.md`
- `commands/stats.md` -> `commands/mneme-stats.md`
```

```md
## OpenCode Transparency

When the local OpenCode plugin is installed, mneme can observe `bash`, `webfetch`, `read`, and `grep` through `tool.execute.before` / `tool.execute.after`, and it can react to `session.created`, `session.compacted`, and `session.idle` through the local `.opencode/plugins/mneme.js` runtime plugin.
```

- [ ] **Step 4: Add the Mneme install mapping**

```md
### mneme

Create these relative paths under the selected target root:

- `plugins/mneme.js`
- `commands/mneme-doctor.md`
- `commands/mneme-plugin.md`
- `commands/mneme-remember.md`
- `commands/mneme-setup.md`
- `commands/mneme-stats.md`
- `skills/mneme/SKILL.md`
```

- [ ] **Step 5: If the gate fails, stop at blocker docs instead of inventing a degraded fake port**

```md
| `mneme` | defer with blockers | OpenCode local JS plugin hooks did not provide a reliable enough pre/post-tool routing surface for repository-supported installation |
```

- [ ] **Step 6: Run validation and commit either the Mneme port or the blocker docs**

Run: `node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`

Expected: `OpenCode marketplace validation passed.`

```bash
git add .opencode/INSTALL.md docs/marketplaces/platform-support-matrix.md docs/marketplaces/opencode-roadmap.md opencode-marketplace/plugins/mneme
git commit -m "feat(opencode): add mneme plugin support"
```

### Task 7: Port Arc to OpenCode Only If the Arc Gate Clears

**Files:**
- Create: `opencode-marketplace/plugins/arc/README.md`
- Create: `opencode-marketplace/plugins/arc/CHANGELOG.md`
- Create: `opencode-marketplace/plugins/arc/version.txt`
- Create: `opencode-marketplace/plugins/arc/plugins/arc.js`
- Create: `opencode-marketplace/plugins/arc/commands/arc-*.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-*.md`
- Create: `opencode-marketplace/plugins/arc/skills/{arc,arc-brainstorm,arc-plan,arc-implement,arc-debug,arc-review,arc-verify,arc-finish,arc-team-deploy}/**`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`

- [ ] **Step 1: Confirm the `arc` gate conditions in the support matrix before creating files**

Run: `rg -n "arc.*conditional port|Local JS/TS hook plugins|globally unique skill names|reduced OpenCode arc runtime" docs/marketplaces/platform-support-matrix.md`

Expected: all four arc gate conditions are present and marked acceptable.

- [ ] **Step 2: If the gate passes, create the reduced OpenCode priming plugin**

```text
# opencode-marketplace/plugins/arc/version.txt
0.7.0
```

```md
# opencode-marketplace/plugins/arc/CHANGELOG.md

## 0.7.0

- Initial OpenCode marketplace port for `arc`
```

```md
# opencode-marketplace/plugins/arc/README.md

OpenCode port of the `arc` plugin.

## Runtime Surface

- `plugins/arc.js`
- `commands/arc-*.md`
- `agents/arc-*.md`
- namespaced `skills/arc-*`

## Compatibility Note

This port keeps automatic `arc prime` on session creation and compaction, but it does not claim Claude-equivalent spawned-agent registration.
```

```js
export const ArcPlugin = async ({ $ }) => ({
  event: async ({ event }) => {
    if (event.type === "session.created" || event.type === "session.compacted") {
      await $`arc prime`
    }
  },
})

export default ArcPlugin
```

- [ ] **Step 3: Create the prefixed command and agent file set by copying the Codex runtime markdown files with OpenCode-safe filenames**

```text
Command filename mapping:
- `close.md` -> `arc-close.md`
- `create.md` -> `arc-create.md`
- `db.md` -> `arc-db.md`
- `dep.md` -> `arc-dep.md`
- `docs.md` -> `arc-docs.md`
- `init.md` -> `arc-init.md`
- `list.md` -> `arc-list.md`
- `onboard.md` -> `arc-onboard.md`
- `paths.md` -> `arc-paths.md`
- `plugin.md` -> `arc-plugin.md`
- `prime.md` -> `arc-prime.md`
- `project.md` -> `arc-project.md`
- `quickstart.md` -> `arc-quickstart.md`
- `ready.md` -> `arc-ready.md`
- `self.md` -> `arc-self.md`
- `server.md` -> `arc-server.md`
- `show.md` -> `arc-show.md`
- `stats.md` -> `arc-stats.md`
- `team.md` -> `arc-team.md`
- `update.md` -> `arc-update.md`
- `which.md` -> `arc-which.md`
- `blocked.md` -> `arc-blocked.md`
- `migrate-paths.md` -> `arc-migrate-paths.md`
```

```text
Agent files are already OpenCode-safe because they are prefixed:
- `arc-evaluator.md`
- `arc-doc-writer.md`
- `arc-issue-tracker.md`
- `arc-reviewer.md`
- `arc-implementer.md`
```

- [ ] **Step 4: Rename the generic skill names to globally unique OpenCode names and update internal references**

```text
Skill rename mapping:
- `brainstorm` -> `arc-brainstorm`
- `plan` -> `arc-plan`
- `implement` -> `arc-implement`
- `debug` -> `arc-debug`
- `review` -> `arc-review`
- `verify` -> `arc-verify`
- `finish` -> `arc-finish`
- `arc` -> `arc`
- `arc-team-deploy` -> `arc-team-deploy`
```

```md
Update these internal references everywhere inside the OpenCode `arc` skill tree:

- `invoke the \`plan\` skill` -> `invoke the \`arc-plan\` skill`
- `invoke the \`implement\` skill` -> `invoke the \`arc-implement\` skill`
- `invoke the \`debug\` skill` -> `invoke the \`arc-debug\` skill`
- `invoke the \`review\` skill` -> `invoke the \`arc-review\` skill`
- `invoke the \`verify\` skill` -> `invoke the \`arc-verify\` skill`
- `invoke the \`finish\` skill` -> `invoke the \`arc-finish\` skill`
- `invoke the \`brainstorm\` skill` -> `invoke the \`arc-brainstorm\` skill`
```

- [ ] **Step 5: Add the OpenCode `arc` install mapping and document the intentional degradation**

```md
## Compatibility note

The OpenCode `arc` port provides command docs, skills, agents, and automatic `arc prime` on `session.created` / `session.compacted` through `.opencode/plugins/arc.js`.

It does not claim Claude-equivalent spawned-agent registration. If OpenCode later exposes a stable equivalent, that should be added in a follow-up change.
```

```md
### arc

Create these relative paths under the selected target root:

- `plugins/arc.js`
- `commands/arc-close.md`
- `commands/arc-create.md`
- `commands/arc-db.md`
- `commands/arc-dep.md`
- `commands/arc-docs.md`
- `commands/arc-init.md`
- `commands/arc-list.md`
- `commands/arc-onboard.md`
- `commands/arc-paths.md`
- `commands/arc-plugin.md`
- `commands/arc-prime.md`
- `commands/arc-project.md`
- `commands/arc-quickstart.md`
- `commands/arc-ready.md`
- `commands/arc-self.md`
- `commands/arc-server.md`
- `commands/arc-show.md`
- `commands/arc-stats.md`
- `commands/arc-team.md`
- `commands/arc-update.md`
- `commands/arc-which.md`
- `commands/arc-blocked.md`
- `commands/arc-migrate-paths.md`
- `agents/arc-evaluator.md`
- `agents/arc-doc-writer.md`
- `agents/arc-issue-tracker.md`
- `agents/arc-reviewer.md`
- `agents/arc-implementer.md`
- `skills/arc/SKILL.md`
- `skills/arc/_formatting.md`
- `skills/arc-brainstorm/SKILL.md`
- `skills/arc-plan/SKILL.md`
- `skills/arc-implement/SKILL.md`
- `skills/arc-debug/SKILL.md`
- `skills/arc-review/SKILL.md`
- `skills/arc-verify/SKILL.md`
- `skills/arc-finish/SKILL.md`
- `skills/arc-team-deploy/SKILL.md`
```

- [ ] **Step 6: If the gate fails, explicitly document the blocker and stop**

```md
| `arc` | defer with blockers | OpenCode `arc` still lacks a maintainable namespaced skill + priming story, so this pass keeps the decision documented instead of shipping an unstable partial port |
```

- [ ] **Step 7: Run validation and commit either the OpenCode arc port or the blocker docs**

Run: `node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`

Expected: `OpenCode marketplace validation passed.`

```bash
git add .opencode/INSTALL.md docs/marketplaces/platform-support-matrix.md docs/marketplaces/opencode-roadmap.md opencode-marketplace/plugins/arc
git commit -m "feat(opencode): add arc plugin runtime"
```

### Task 8: Final Validation and Support-Surface Verification

**Files:**
- Modify: `docs/marketplaces/platform-support-matrix.md` (only if validation changes a decision)
- Modify: `.opencode/INSTALL.md` (only if validation finds a missing path)

- [ ] **Step 1: Run the shared, Codex, and OpenCode validators together**

Run: `node shared/scripts/validate-shared.mjs && node codex-marketplace/scripts/validate-codex-marketplace.mjs && node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`

Expected:

```text
Shared layout validation passed.
Codex marketplace validation passed.
OpenCode marketplace validation passed.
```

- [ ] **Step 2: Verify that `.opencode/INSTALL.md` covers every supported plugin section**

Run: `rg -n "^### (slop-review|worktrunk|atlassian|mneme|arc)$|^## Supported Plugins|^## Available Selections" .opencode/INSTALL.md`

Expected: one section per supported plugin and a single supported-plugin list that matches the final support matrix.

- [ ] **Step 3: Spot-check flat namespace safety in the OpenCode tree**

Run: `rg -n "^name: " opencode-marketplace/plugins/*/skills/*/SKILL.md && ls opencode-marketplace/plugins/*/commands opencode-marketplace/plugins/*/agents 2>/dev/null`

Expected: no duplicate generic skill names such as bare `plan`, `review`, or `finish` across plugin roots; commands and agents remain plugin-prefixed.

- [ ] **Step 4: Review the final diff for only the intended surfaces**

Run: `git diff --stat -- README.md docs/marketplaces docs/superpowers codex-marketplace opencode-marketplace .opencode/INSTALL.md`

Expected: changes limited to marketplace docs, validator scripts, install docs, and the intended plugin roots.

- [ ] **Step 5: Commit the final verification fixes if any were needed**

```bash
git add README.md docs/marketplaces codex-marketplace opencode-marketplace .opencode/INSTALL.md shared/scripts/validate-shared.mjs
git commit -m "chore: finalize marketplace review and validation"
```

# OpenCode Arc Proof And Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove whether OpenCode can honestly support the approved interactive-first `arc` workflow contract across interactive web, interactive CLI sessions, and attached sessions, then either ship the OpenCode `arc` marketplace port only if that full contract is proven or narrow the blocker docs based on real runtime evidence while keeping `opencode run` testing-only until separately proven.

**Architecture:** Start with a proof spike in a clean OpenCode temp environment, but treat interactive web, interactive CLI sessions, and attached sessions as the primary verification surfaces so the official marketplace tree and installer docs do not claim support prematurely. Use `opencode run` only for narrow testing repros unless it is separately proven for the primary contract. A single attached-session proof can be useful partial evidence, but it is not sufficient on its own; only once the full interactive-first proof succeeds should the work create `opencode-marketplace/plugins/arc/`, adapt the Codex `arc` runtime markdown into OpenCode-prefixed commands and agents, rewrite the skill corpus to OpenCode-native semantics using Superpowers as the workflow reference, then update installer/support docs and rerun validators.

**Tech Stack:** Markdown plugin assets, OpenCode local runtime plugin JS, OpenCode commands/agents/skills layout, arc CLI, Node.js validation scripts, shell-based runtime proof commands

---

## Working Constraints

- The repo is dirty. Preserve unrelated changes.
- Do not commit unless the user explicitly asks.
- Do not update `.opencode/INSTALL.md`, `docs/marketplaces/platform-support-matrix.md`, or `docs/marketplaces/opencode-roadmap.md` until the full interactive-first proof passes.
- Keep command filenames plugin-prefixed.
- Keep agent filenames plugin-prefixed.
- Keep skill names globally unique.
- Keep any OpenCode runtime plugin fail-open.

## File Structure Map

### Persistent Repo Files For The Proof And Port

- Create: `docs/marketplaces/opencode-arc-proof.md`
- Create: `opencode-marketplace/plugins/arc/README.md`
- Create: `opencode-marketplace/plugins/arc/CHANGELOG.md`
- Create: `opencode-marketplace/plugins/arc/version.txt`
- Create: `opencode-marketplace/plugins/arc/plugins/arc.js`
- Create: `opencode-marketplace/plugins/arc/commands/arc-blocked.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-close.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-create.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-db.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-dep.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-docs.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-init.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-list.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-migrate-paths.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-onboard.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-paths.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-plugin.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-prime.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-project.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-quickstart.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-ready.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-self.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-server.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-show.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-stats.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-team.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-update.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-which.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-doc-writer.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-evaluator.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-implementer.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-issue-tracker.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-reviewer.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc/_formatting.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-brainstorm/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-plan/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-implement/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-debug/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-review/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-verify/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-finish/SKILL.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`
- Modify: `opencode-marketplace/README.md`

### Source Files To Adapt

- Read from: `codex-marketplace/plugins/arc/commands/*.md`
- Read from: `codex-marketplace/plugins/arc/agents/*.md`
- Read from: `codex-marketplace/plugins/arc/skills/arc/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/arc/_formatting.md`
- Read from: `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/plan/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/implement/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/debug/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/review/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/verify/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/skills/finish/SKILL.md`
- Read from: `codex-marketplace/plugins/arc/agents/arc-evaluator.md`
- Read from: `/home/bfirestone/.codex/plugins/cache/openai-curated/superpowers/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/brainstorming/SKILL.md`
- Read from: `/home/bfirestone/.codex/plugins/cache/openai-curated/superpowers/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/subagent-driven-development/SKILL.md`
- Read from: `/home/bfirestone/.codex/plugins/cache/openai-curated/superpowers/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/verification-before-completion/SKILL.md`
- Read from: `/home/bfirestone/.codex/plugins/cache/openai-curated/superpowers/b1986b3d3da5bb8a04d3cb1e69af5a29bb5c2c04/skills/systematic-debugging/SKILL.md`

### Temporary Proof Workspace

- Use: `/tmp/opencode-arc-proof-home/`
- Use: `/tmp/opencode-arc-proof-project/`
- Use: `/tmp/opencode-arc-proof-project/.opencode/`

### Repo Tests And Validators

- Run: `node shared/scripts/validate-shared.mjs`
- Run: `node opencode-marketplace/scripts/validate-opencode-marketplace.mjs`
- Run: `node codex-marketplace/scripts/validate-codex-marketplace.mjs`

### Runtime Proof Commands

- Run: `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode --help`
- Run: `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode agent list`
- Run interactive web session proofs
- Run interactive CLI sessions proofs
- Run attached sessions proofs
- Run: `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode run ...` for testing-only repros, not as part of the primary workflow contract

### Task 1: Create The Proof Evidence Log And Clean Proof Harness

**Files:**
- Create: `docs/marketplaces/opencode-arc-proof.md`

- [ ] **Step 1: Write the proof log skeleton**

```md
# OpenCode Arc Proof Log

Date: 2026-04-20

## Goal

Capture end-to-end evidence for the interactive OpenCode `arc` workflow contract before any support docs flip from deferred to supported.

## Questions To Prove

- Can an interactive OpenCode surface dispatch sequentially into named `arc-*` agents?
- Can interactive OpenCode sessions round-trip native structured question flow?
- Can a real OpenCode workflow create and update todos?
- Can the OpenCode runtime plugin fail-open while auto-running `arc prime`?
- Can `arc-evaluator` stay honest without claiming worktree isolation?

## Evidence

## Result
```

- [ ] **Step 2: Create the clean proof directories**

Run: `rm -rf /tmp/opencode-arc-proof-home /tmp/opencode-arc-proof-project && mkdir -p /tmp/opencode-arc-proof-home/.config /tmp/opencode-arc-proof-project/.opencode/{plugins,commands,agents,skills}`

Expected: both temp directories exist and are empty except for the created `.opencode/` subdirectories

- [ ] **Step 3: Verify OpenCode can start in the clean temp environment**

Run: `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode --help >/tmp/opencode-arc-proof-help.txt`

Expected: exit code `0` and `/tmp/opencode-arc-proof-help.txt` contains the CLI help text

- [ ] **Step 4: Verify the clean temp environment avoids the current WAL issue**

Run: `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode agent list >/tmp/opencode-arc-proof-agent-list.txt`

Expected: exit code `0`; if this still fails with a DB or WAL error, stop and record the blocker in `docs/marketplaces/opencode-arc-proof.md`

### Task 2: Build The Smallest Proof Slice In The Temp OpenCode Workspace

**Files:**
- Create: `/tmp/opencode-arc-proof-project/.opencode/plugins/arc.js`
- Create: `/tmp/opencode-arc-proof-project/.opencode/agents/arc-implementer.md`
- Create: `/tmp/opencode-arc-proof-project/.opencode/agents/arc-reviewer.md`
- Create: `/tmp/opencode-arc-proof-project/.opencode/agents/arc-evaluator.md`
- Create: `/tmp/opencode-arc-proof-project/.opencode/commands/arc-proof.md`
- Create: `/tmp/opencode-arc-proof-project/.opencode/skills/arc-proof/SKILL.md`
- Modify: `docs/marketplaces/opencode-arc-proof.md`

- [ ] **Step 1: Write the fail-open runtime plugin**

Create `/tmp/opencode-arc-proof-project/.opencode/plugins/arc.js` with:

```js
export const ArcPlugin = async ({ $ }) => ({
  event: async ({ event }) => {
    if (event.type !== "session.created" && event.type !== "session.compacted") {
      return
    }

    try {
      await $`arc prime`
    } catch {
      // Fail open so missing or unhealthy arc never blocks OpenCode.
    }
  },
})

export default ArcPlugin
```

- [ ] **Step 2: Create one proof command that routes into a named subagent path**

Create `/tmp/opencode-arc-proof-project/.opencode/commands/arc-proof.md` with:

```md
---
description: Proof-only command for OpenCode arc runtime validation
---

Load the `arc-proof` skill and execute its proof workflow for: `$ARGUMENTS`.
```

- [ ] **Step 3: Create one proof skill that exercises questions, todos, and subagent handoff**

Create `/tmp/opencode-arc-proof-project/.opencode/skills/arc-proof/SKILL.md` with:

```md
---
name: arc-proof
description: Proof-only OpenCode arc runtime validation workflow
---

1. Create a short todo list that includes proof setup, proof question, and proof handoff.
2. Ask one structured multiple-choice question about whether to continue the proof.
3. If the user approves, dispatch a named subagent for a tiny bounded task.
4. Report what succeeded and what failed without claiming unsupported isolation.
```

- [ ] **Step 4: Create minimal named agents for the proof**

Create `/tmp/opencode-arc-proof-project/.opencode/agents/arc-implementer.md` with:

```md
---
description: Proof-only implementer
---

You are a proof-only implementer. Perform one tiny bounded task and report back plainly.
```

Create `/tmp/opencode-arc-proof-project/.opencode/agents/arc-reviewer.md` with:

```md
---
description: Proof-only reviewer
---

You are a proof-only reviewer. Review a tiny bounded result and report back plainly.
```

Create `/tmp/opencode-arc-proof-project/.opencode/agents/arc-evaluator.md` with:

```md
---
description: Proof-only evaluator
---

You are a proof-only evaluator. Do not claim worktree isolation. If you cannot verify safely, report BLOCKED.
```

- [ ] **Step 5: Run the proof command on the primary interactive surfaces**

Run interactive web, interactive CLI, and attached-session proofs for `arc-proof` as the primary evidence path for the full contract. If you need a testing-only comparison point, capture a separate direct/local `opencode run` repro without treating it as the primary proof command. The reviewed `run` proof surface in this task is the attached-session invocation via `--attach`, not standalone local one-shot `opencode run`; attached-session proof alone counts only as partial evidence.

Example attached-session proof command:

`HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode run --attach http://127.0.0.1:4197 --password proofpass --dir /tmp/opencode-arc-proof-project --command arc-proof`

Expected: one of two valid outcomes:
- all primary interactive surfaces prove the intended question, todo, and named-agent path
- the runtime fails narrowly enough, or only partially succeeds on some surfaces, to document the exact unsupported or still-unproven primitive and keep `run` testing-only

- [ ] **Step 6: Record the proof result**

Append to `docs/marketplaces/opencode-arc-proof.md`:

```md
## Evidence

- Command: `...`
- Exit status: `...`
- Observed native structured question flow on interactive sessions: `yes|no`
- Observed todo flow: `yes|no`
- Observed named-agent dispatch: `yes|no`
- Observed fail-open auto-run of `arc prime`: `yes|no|partial`
- Observed evaluator safety behavior: `safe cleanup|read-only only|blocked`

## Result

- PASS: full interactive-first contract proven across interactive web, interactive CLI, and attached sessions, including fail-open `arc prime` auto-run and honest evaluator behavior without claimed worktree isolation
- PARTIAL: attached-session and/or other single-surface evidence is useful but not sufficient to ship or flip support docs
- or FAIL: ...
```

### Task 3: If The Full Interactive-First Proof Does Not Pass, Narrow The Blocker Docs And Stop

**Files:**
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`
- Modify: `docs/marketplaces/opencode-arc-proof.md`

- [ ] **Step 1: Update the support matrix with the exact failed primitive**

Replace the broad `arc` blocker row text with a proof-backed note like:

```md
| `arc` | defer with blockers | Proof spike showed that OpenCode still lacks or does not cleanly expose `<exact primitive>` for the intended `arc` workflow, so the port remains deferred until that runtime contract is proven. |
```

- [ ] **Step 2: Update the roadmap blocker text**

Replace the current `arc` deferred note with:

```md
- `arc`: proof spike in `docs/marketplaces/opencode-arc-proof.md` showed that `<exact primitive>` still blocks the baseline sequential workflow, so OpenCode `arc` remains deferred
```

- [ ] **Step 3: Stop without creating the official marketplace plugin tree**

Run: `test ! -d opencode-marketplace/plugins/arc`

Expected: exit code `0`

### Task 4: If The Full Interactive-First Proof Passes, Create The Official OpenCode Arc Plugin Scaffold

**Files:**
- Create: `opencode-marketplace/plugins/arc/README.md`
- Create: `opencode-marketplace/plugins/arc/CHANGELOG.md`
- Create: `opencode-marketplace/plugins/arc/version.txt`
- Create: `opencode-marketplace/plugins/arc/plugins/arc.js`

- [ ] **Step 1: Create the plugin directories**

Run: `mkdir -p opencode-marketplace/plugins/arc/{plugins,commands,agents,skills/arc,skills/arc-brainstorm,skills/arc-plan,skills/arc-implement,skills/arc-debug,skills/arc-review,skills/arc-verify,skills/arc-finish}`

Expected: all plugin directories exist

- [ ] **Step 2: Write `version.txt`**

Create `opencode-marketplace/plugins/arc/version.txt` with:

```text
0.1.0
```

- [ ] **Step 3: Write `CHANGELOG.md`**

Create `opencode-marketplace/plugins/arc/CHANGELOG.md` with:

```md
# Changelog

## 0.1.0

- Initial OpenCode `arc` proof-backed port
```

- [ ] **Step 4: Write `README.md`**

Create `opencode-marketplace/plugins/arc/README.md` with:

```md
# arc for OpenCode

OpenCode port of the `arc` plugin.

## Runtime Surface

- `plugins/arc.js`
- `commands/arc-*.md`
- `agents/arc-*.md`
- `skills/arc*`

## Compatibility Note

This port supports a sequential, subagent-driven OpenCode workflow.
It does not claim worktree-isolated parallel orchestration or team deploy support.
```

- [ ] **Step 5: Copy the fail-open runtime plugin into the official tree**

Copy `/tmp/opencode-arc-proof-project/.opencode/plugins/arc.js` to `opencode-marketplace/plugins/arc/plugins/arc.js`

Run: `node --check opencode-marketplace/plugins/arc/plugins/arc.js`

Expected: exit code `0`

### Task 5: Port The Command Markdown Set

**Files:**
- Create: `opencode-marketplace/plugins/arc/commands/arc-blocked.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-close.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-create.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-db.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-dep.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-docs.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-init.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-list.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-migrate-paths.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-onboard.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-paths.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-plugin.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-prime.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-project.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-quickstart.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-ready.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-self.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-server.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-show.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-stats.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-team.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-update.md`
- Create: `opencode-marketplace/plugins/arc/commands/arc-which.md`

- [ ] **Step 1: Copy the Codex command docs into prefixed OpenCode filenames**

Run:

```bash
for name in blocked close create db dep docs init list migrate-paths onboard paths plugin prime project quickstart ready self server show stats team update which; do
  cp "codex-marketplace/plugins/arc/commands/${name}.md" "opencode-marketplace/plugins/arc/commands/arc-${name}.md"
done
```

Expected: all 23 prefixed command files exist in `opencode-marketplace/plugins/arc/commands/`

- [ ] **Step 2: Rewrite the command docs that reference unsupported workflow claims**

Edit these files with exact policy changes:

- `opencode-marketplace/plugins/arc/commands/arc-plugin.md`
  Replace Codex-specific compatibility text with OpenCode text that claims only:
  - fail-open `arc prime` automation
  - prefixed commands, agents, and skills
  - sequential subagent-driven workflow
  - no worktree-isolated parallel claims

- `opencode-marketplace/plugins/arc/commands/arc-team.md`
  Keep `arc team context` documentation only.
  Add one sentence that `arc-team-deploy` is not part of the OpenCode port.

- `opencode-marketplace/plugins/arc/commands/arc-prime.md`
  Keep the `arc prime` instruction simple and mention the local plugin auto-runs it when installed.

- [ ] **Step 3: Verify command prefix compliance**

Run: `find opencode-marketplace/plugins/arc/commands -maxdepth 1 -type f -name '*.md' | sed 's#.*/##' | grep -v '^arc-'`

Expected: no output

### Task 6: Port The Agent Markdown Set And Rewrite The Evaluator

**Files:**
- Create: `opencode-marketplace/plugins/arc/agents/arc-doc-writer.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-evaluator.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-implementer.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-issue-tracker.md`
- Create: `opencode-marketplace/plugins/arc/agents/arc-reviewer.md`

- [ ] **Step 1: Copy the Codex agent docs**

Run:

```bash
cp codex-marketplace/plugins/arc/agents/arc-doc-writer.md opencode-marketplace/plugins/arc/agents/arc-doc-writer.md
cp codex-marketplace/plugins/arc/agents/arc-evaluator.md opencode-marketplace/plugins/arc/agents/arc-evaluator.md
cp codex-marketplace/plugins/arc/agents/arc-implementer.md opencode-marketplace/plugins/arc/agents/arc-implementer.md
cp codex-marketplace/plugins/arc/agents/arc-issue-tracker.md opencode-marketplace/plugins/arc/agents/arc-issue-tracker.md
cp codex-marketplace/plugins/arc/agents/arc-reviewer.md opencode-marketplace/plugins/arc/agents/arc-reviewer.md
```

Expected: all 5 agent files exist

- [ ] **Step 2: Rewrite `arc-evaluator.md` to the approved non-worktree model**

Replace the worktree section in `opencode-marketplace/plugins/arc/agents/arc-evaluator.md` with:

```md
## Runtime Model

You do not have guaranteed worktree isolation in OpenCode.
Do not claim automatic cleanup or disposable scratch space.
Prefer read-only verification when possible.
Only create temporary acceptance artifacts when you can also remove them safely before finishing.
If safe cleanup cannot be guaranteed, report `BLOCKED`.
```

- [ ] **Step 3: Remove any remaining worktree-isolation claims**

Run: `rg -n "git worktree|worktree is automatically|cleanup is automatic|isolation" opencode-marketplace/plugins/arc/agents`

Expected: no matches that still claim automatic evaluator isolation

### Task 7: Rewrite The OpenCode Skill Set Using Superpowers Workflow Mechanics

**Files:**
- Create: `opencode-marketplace/plugins/arc/skills/arc/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc/_formatting.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-brainstorm/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-plan/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-implement/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-debug/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-review/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-verify/SKILL.md`
- Create: `opencode-marketplace/plugins/arc/skills/arc-finish/SKILL.md`

- [ ] **Step 1: Copy the formatting helper and core `arc` skill**

Run:

```bash
cp codex-marketplace/plugins/arc/skills/arc/_formatting.md opencode-marketplace/plugins/arc/skills/arc/_formatting.md
cp codex-marketplace/plugins/arc/skills/arc/SKILL.md opencode-marketplace/plugins/arc/skills/arc/SKILL.md
```

Expected: both files exist

- [ ] **Step 2: Copy the workflow skills into renamed OpenCode skill directories**

Run:

```bash
cp codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md opencode-marketplace/plugins/arc/skills/arc-brainstorm/SKILL.md
cp codex-marketplace/plugins/arc/skills/plan/SKILL.md opencode-marketplace/plugins/arc/skills/arc-plan/SKILL.md
cp codex-marketplace/plugins/arc/skills/implement/SKILL.md opencode-marketplace/plugins/arc/skills/arc-implement/SKILL.md
cp codex-marketplace/plugins/arc/skills/debug/SKILL.md opencode-marketplace/plugins/arc/skills/arc-debug/SKILL.md
cp codex-marketplace/plugins/arc/skills/review/SKILL.md opencode-marketplace/plugins/arc/skills/arc-review/SKILL.md
cp codex-marketplace/plugins/arc/skills/verify/SKILL.md opencode-marketplace/plugins/arc/skills/arc-verify/SKILL.md
cp codex-marketplace/plugins/arc/skills/finish/SKILL.md opencode-marketplace/plugins/arc/skills/arc-finish/SKILL.md
```

Expected: all renamed skill files exist

- [ ] **Step 3: Rename internal skill references to the OpenCode-safe names**

Run:

```bash
perl -0pi -e 's/`brainstorm`/`arc-brainstorm`/g; s/`plan`/`arc-plan`/g; s/`implement`/`arc-implement`/g; s/`debug`/`arc-debug`/g; s/`review`/`arc-review`/g; s/`verify`/`arc-verify`/g; s/`finish`/`arc-finish`/g' \
  opencode-marketplace/plugins/arc/skills/arc-brainstorm/SKILL.md \
  opencode-marketplace/plugins/arc/skills/arc-plan/SKILL.md \
  opencode-marketplace/plugins/arc/skills/arc-implement/SKILL.md \
  opencode-marketplace/plugins/arc/skills/arc-debug/SKILL.md \
  opencode-marketplace/plugins/arc/skills/arc-review/SKILL.md \
  opencode-marketplace/plugins/arc/skills/arc-verify/SKILL.md \
  opencode-marketplace/plugins/arc/skills/arc-finish/SKILL.md
```

Expected: the renamed skills refer only to `arc-*` workflow skills

- [ ] **Step 4: Rewrite OpenCode workflow mechanics in the high-risk skills**

Make these exact semantic changes:

- `opencode-marketplace/plugins/arc/skills/arc-brainstorm/SKILL.md`
  Replace `TaskCreate` wording with OpenCode todo wording.
  Replace `AskUserQuestion` wording with OpenCode structured question wording.

- `opencode-marketplace/plugins/arc/skills/arc-plan/SKILL.md`
  Replace Codex `Agent` or `subagent_type` wording with OpenCode named-subtask wording.

- `opencode-marketplace/plugins/arc/skills/arc-implement/SKILL.md`
  Replace Codex `Agent` dispatch wording with sequential named-subtask orchestration.
  Remove any `isolation: "worktree"` and parallel batch requirements.

- `opencode-marketplace/plugins/arc/skills/arc-review/SKILL.md`
  Replace Codex reviewer dispatch wording with OpenCode named-subtask wording.

- `opencode-marketplace/plugins/arc/skills/arc-verify/SKILL.md`
  Keep evidence-first verification language and remove any Codex-only tool names.

- `opencode-marketplace/plugins/arc/skills/arc-finish/SKILL.md`
  Keep close-out discipline but do not add commit or push instructions, because commits are outside this execution scope unless the user asks.

- [ ] **Step 5: Use Superpowers skills as the wording reference**

For each of:

- `opencode-marketplace/plugins/arc/skills/arc-brainstorm/SKILL.md`
- `opencode-marketplace/plugins/arc/skills/arc-implement/SKILL.md`
- `opencode-marketplace/plugins/arc/skills/arc-debug/SKILL.md`
- `opencode-marketplace/plugins/arc/skills/arc-verify/SKILL.md`

compare against the matching Superpowers skill and align:

- question cadence
- subagent orchestration wording
- verification wording
- debugging process wording

Expected: the OpenCode `arc` skills inherit OpenCode-friendly workflow mechanics instead of Codex-only terminology

- [ ] **Step 6: Prove no deferred skill slipped into the port**

Run: `test ! -e opencode-marketplace/plugins/arc/skills/arc-team-deploy/SKILL.md`

Expected: exit code `0`

### Task 8: Update Installer And Support Docs After Proof Success

**Files:**
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/marketplaces/platform-support-matrix.md`
- Modify: `docs/marketplaces/opencode-roadmap.md`
- Modify: `opencode-marketplace/README.md`
- Modify: `docs/marketplaces/opencode-arc-proof.md`

- [ ] **Step 1: Add `arc` to Supported Plugins and Available Selections**

In `.opencode/INSTALL.md`, add:

```md
- `arc`: installs the local runtime plugin, `arc` skills, `arc-*` agents, and `/arc-*` commands
```

and:

```md
- `arc`
```

- [ ] **Step 2: Add the `### arc` file mapping section**

In `.opencode/INSTALL.md`, list every target path from:

- `plugins/arc.js`
- `commands/arc-*.md`
- `agents/arc-*.md`
- `skills/arc*`

and include both the remote raw GitHub paths and local `opencode-marketplace/plugins/arc/...` source paths so the validator sees full coverage.

- [ ] **Step 3: Flip the support matrix row only after full interactive-first proof**

Replace the `arc` row in `docs/marketplaces/platform-support-matrix.md` only if interactive web, interactive CLI, and attached sessions are all proven, with:

```md
| `arc` | port now | OpenCode proof spike demonstrated the baseline interactive-first `arc` workflow across interactive web, interactive CLI, and attached sessions, including native structured question flow where required; `opencode run` remains testing-only until separately proven, and isolated parallel worktree orchestration plus `arc-team-deploy` remain deferred |
```

- [ ] **Step 4: Update the roadmap**

Replace the `arc` deferred blocker note in `docs/marketplaces/opencode-roadmap.md` only after full interactive-first proof, with:

```md
- `arc`: full interactive-first proof now covers interactive web, interactive CLI, and attached sessions for the baseline sequential named-agent path, while isolated parallel worktree orchestration and `arc-team-deploy` remain deferred
```

- [ ] **Step 5: Update the OpenCode marketplace README**

Add `arc` to the list of currently installed OpenCode plugin surfaces and note that OpenCode `arc` is sequential and proof-backed, not parity-driven.

- [ ] **Step 6: Preserve the proof evidence**

In `docs/marketplaces/opencode-arc-proof.md`, add the final conclusion:

```md
## Final Conclusion

The OpenCode proof spike demonstrated the baseline sequential named-agent `arc` workflow only after the full interactive-first contract was proven across interactive web, interactive CLI, and attached sessions.
Attached-session-only evidence is useful for narrowing blockers but is not sufficient to ship or flip support docs, and `opencode run` is testing-only rather than part of the primary workflow contract.
Deferred: isolated parallel worktree orchestration and `arc-team-deploy`.
```

### Task 9: Run Validators And Final Sanity Checks

**Files:**
- Test: `docs/marketplaces/opencode-arc-proof.md`
- Test: `.opencode/INSTALL.md`
- Test: `opencode-marketplace/plugins/arc/**`
- Test: `docs/marketplaces/platform-support-matrix.md`
- Test: `docs/marketplaces/opencode-roadmap.md`

- [ ] **Step 1: Run the repo validators**

Run:

```bash
node shared/scripts/validate-shared.mjs && \
node codex-marketplace/scripts/validate-codex-marketplace.mjs && \
node opencode-marketplace/scripts/validate-opencode-marketplace.mjs
```

Expected:

```text
Shared layout validation passed.
Codex marketplace validation passed.
OpenCode marketplace validation passed.
```

- [ ] **Step 2: Verify no unprefixed OpenCode command or agent filenames slipped in**

Run:

```bash
find opencode-marketplace/plugins/arc/commands -maxdepth 1 -type f -name '*.md' | sed 's#.*/##' | grep -v '^arc-' && exit 1 || true
find opencode-marketplace/plugins/arc/agents -maxdepth 1 -type f -name '*.md' | sed 's#.*/##' | grep -v '^arc-' && exit 1 || true
```

Expected: no unprefixed filenames are printed

- [ ] **Step 3: Verify all shipped skill names are globally unique**

Run:

```bash
rg -n '^name:' opencode-marketplace/plugins/arc/skills opencode-marketplace/plugins/*/skills
```

Expected: no duplicate OpenCode skill names across plugins

- [ ] **Step 4: Verify the deferred surfaces remain deferred**

Run:

```bash
rg -n 'arc-team-deploy|isolation: "worktree"|subagent_type' \
  opencode-marketplace/plugins/arc \
  docs/marketplaces/platform-support-matrix.md \
  docs/marketplaces/opencode-roadmap.md
```

Expected:
- `arc-team-deploy` only appears in explicit deferred notes
- no OpenCode skill or agent text still claims `isolation: "worktree"` or Codex `subagent_type`

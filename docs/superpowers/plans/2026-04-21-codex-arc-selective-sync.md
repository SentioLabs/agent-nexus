# Codex Arc Selective Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cherry-pick the approved Claude `arc` workflow improvements into the Codex `arc` plugin, add the new `arc-spec-reviewer`, and keep Codex-only packaging truthful and minimal.

**Architecture:** Treat `claude-marketplace/plugins/arc/` as the shared-workflow upstream for `agents/arc-implementer.md` and `skills/{plan,implement,review}.md`, while leaving Codex-owned packaging and hook files alone except for release metadata. Execute the sync in serialized tasks because the richer implementer result model and the new spec-reviewer wiring both converge in `codex-marketplace/plugins/arc/skills/implement/SKILL.md`.

**Tech Stack:** Markdown skill and agent files, JSON plugin manifest metadata, `git diff --no-index`, `rg`, `jq`, shell verification commands.

---

## File Map

- `docs/superpowers/specs/2026-04-21-codex-arc-selective-sync-design.md`
  Responsibility: approved design and scope boundary for this sync.
- `codex-marketplace/plugins/arc/skills/plan/SKILL.md`
  Responsibility: anti-placeholder planning rules and planner self-review.
- `codex-marketplace/plugins/arc/agents/arc-implementer.md`
  Responsibility: implementer scope discipline, gate checks, and result contract.
- `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md`
  Responsibility: new read-only agent for exact task compliance and scope-boundary verification.
- `codex-marketplace/plugins/arc/skills/implement/SKILL.md`
  Responsibility: orchestrator prompt contract, result triage, and post-implementation dispatch wiring.
- `codex-marketplace/plugins/arc/skills/review/SKILL.md`
  Responsibility: reviewer dispatch prompt and evaluator-aware review behavior.
- `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
  Responsibility: optional wording sync candidate; verify whether any additional change is still needed.
- `codex-marketplace/plugins/arc/skills/debug/SKILL.md`
  Responsibility: optional wording sync candidate; verify whether any additional change is still needed.
- `codex-marketplace/plugins/arc/CHANGELOG.md`
  Responsibility: shipped Codex `arc` release notes for this sync.
- `codex-marketplace/plugins/arc/version.txt`
  Responsibility: plugin release version consumed by repo tooling.
- `codex-marketplace/plugins/arc/.codex-plugin/plugin.json`
  Responsibility: Codex plugin manifest metadata; only the version field should change in this plan.

## Sequencing Notes

- This work is **sequential**, not parallel.
- `skills/implement/SKILL.md` is the integration point for the richer result model and new reviewer wiring, so the agent and skill changes should land before release metadata.
- `skills/brainstorm/SKILL.md` and `skills/debug/SKILL.md` are verification-only in this plan. Leave them untouched unless the verification step shows a real remaining delta worth porting.

### Task 1: Finish the Codex Plan Skill Sync

**Files:**
- Modify: `codex-marketplace/plugins/arc/skills/plan/SKILL.md:19-35`
- Modify: `codex-marketplace/plugins/arc/skills/plan/SKILL.md:230-238`
- Modify: `codex-marketplace/plugins/arc/skills/plan/SKILL.md:314-314`
- Reference: `claude-marketplace/plugins/arc/skills/plan/SKILL.md`
- Reference: `docs/superpowers/specs/2026-04-21-codex-arc-selective-sync-design.md`

- [ ] **Step 1: Prove the remaining Claude wording is still missing**

Run: `rg -n "signatures, logic, and patterns|anti-placeholder rule prevents|No exceptions|plan failures — see the No Placeholders section above" codex-marketplace/plugins/arc/skills/plan/SKILL.md`

Expected: no matches, which confirms the remaining sync work is real and localized.

- [ ] **Step 2: Expand the `No Placeholders` explanation with the exact Claude-compatible paragraph**

Replace the single-line explanation under `## No Placeholders` with:

```md
Code blocks represent the **intent, structure, and behavior** — not a character-for-character mandate. The implementer follows the code block's signatures, logic, and patterns but adapts naming, error handling, and scaffolding to match project conventions (consistent with the implementer's Gate Check 4: Idiomatic Code Quality). Task-internal Design Contracts remain pseudocode that the implementer adapts to language idioms. The anti-placeholder rule prevents *missing* guidance, not idiomatic adaptation.
```

- [ ] **Step 3: Tighten the self-review section so it tells the planner how to fix gaps inline**

Update the `### 6.5. Self-Review` section to read:

```md
### 6.5. Self-Review

After writing all tasks, review the plan against the design before proceeding:

1. **Spec coverage:** Skim each section/requirement in the design. Can you point to a task that implements it? If a gap exists, add the task.
2. **Placeholder scan:** Search all task descriptions for red flags from the No Placeholders list. Fix them.
3. **Type consistency:** Do the types, method signatures, and property names used in later tasks match what was defined in earlier tasks? A function called `clearLayers()` in T1 but `clearFullLayers()` in T3 is a bug.
4. **Step completeness:** Every code step has a code block. Every command step has the exact command and expected output. No exceptions.

Fix issues inline. No need to re-review — just fix and move on.
```

- [ ] **Step 4: Restore the hard-rule sentence that ties code-step completeness back to `No Placeholders`**

Replace the abbreviated hard-rule line near the task template section with:

```md
**Hard rule:** Every code step requires a code block. Every command step requires the exact command and expected output. Steps without these are plan failures — see the No Placeholders section above.
```

- [ ] **Step 5: Verify the plan skill is now aligned except for intentional Codex wording**

Run: `git diff --no-index -- claude-marketplace/plugins/arc/skills/plan/SKILL.md codex-marketplace/plugins/arc/skills/plan/SKILL.md`

Expected: only the intentional Codex wording remains, especially `Claude Code or Codex` in the new-session example. The `No Placeholders`, `Self-Review`, and hard-rule sections should no longer be part of the diff.

- [ ] **Step 6: Commit the plan-skill sync**

```bash
git add codex-marketplace/plugins/arc/skills/plan/SKILL.md
git commit -m "docs(arc): finish codex plan skill sync"
```

### Task 2: Add the Spec Reviewer and Upgrade the Implementer Agent Contract

**Files:**
- Create: `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md`
- Modify: `codex-marketplace/plugins/arc/agents/arc-implementer.md:24-32`
- Modify: `codex-marketplace/plugins/arc/agents/arc-implementer.md:72-72`
- Modify: `codex-marketplace/plugins/arc/agents/arc-implementer.md:139-147`
- Modify: `codex-marketplace/plugins/arc/agents/arc-implementer.md:149-190`
- Reference: `claude-marketplace/plugins/arc/agents/arc-spec-reviewer.md`
- Reference: `claude-marketplace/plugins/arc/agents/arc-implementer.md`

- [ ] **Step 1: Confirm the new agent is absent and the richer result model is not yet present**

Run:

```bash
test ! -f codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md
if rg -n "NEEDS_CONTEXT|DONE_WITH_CONCERNS|If any extras found|### Context Needed|### Concerns" codex-marketplace/plugins/arc/agents/arc-implementer.md; then
  exit 1
fi
```

Expected: exit code `0`, proving the new file and richer report contract still need to be added.

- [ ] **Step 2: Create `arc-spec-reviewer.md` from the approved Claude baseline**

Create `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md` with this exact content:

````md
---
description: Use this agent for verifying that an implementation matches its task spec exactly — nothing missing, nothing extra. Dispatched by the implement skill after the implementer completes. Read-only — never modifies code.
tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Arc Spec Reviewer Agent

You verify whether an implementation matches its specification. Nothing more, nothing less.

You have a fresh context window. Everything you need is in your dispatch prompt.

## Iron Law

**Do NOT trust the implementer's report.** The report may be incomplete, inaccurate, or optimistic. You MUST verify everything by reading actual code.

## Your Job

Read the implementation code and verify against the task spec:

### Missing requirements
- Did they implement everything specified in `## Steps`?
- Are there steps they skipped or partially implemented?
- Did they claim something works but didn't actually implement it?
- Does every `## Expected Outcome` item actually work?

### Extra/unneeded work
- Did they create files not listed in `## Files`?
- Did they add functions, methods, types, flags, or config options not in `## Steps`?
- Did they modify files outside `## Scope Boundary`?
- Did they add "nice to haves" — helpers, utilities, extra error handling, logging — that weren't requested?
- Did they refactor adjacent code?

### Misunderstandings
- Did they interpret requirements differently than the spec states?
- Did they solve the wrong problem?
- If code blocks were provided in steps, did they write that code (or equivalent), or did they substitute their own approach?

## How to Verify

1. Read the task's `## Files` section — identify every file that should exist or be modified
2. Read each file. Compare actual code against what `## Steps` specified
3. Check for files changed that aren't in `## Files` (use `git diff --name-only` if a base SHA is provided)
4. Check for extra functions/types/exports beyond what the spec describes
5. Check test coverage alignment: compare the task's `## Expected Outcome` against the implementer's test assertions. Do the tests verify the behaviors the spec describes, or do they only test implementation details? Flag gaps where a spec behavior has no corresponding test assertion.

## Report Format

```md
## Result: COMPLIANT | ISSUES

### Missing (only if ISSUES)
- <what's missing, with file:line references>

### Extra (only if ISSUES)
- <what was added beyond spec, with file:line references>

### Misunderstood (only if ISSUES)
- <what was misinterpreted, with spec quote vs actual behavior>
```

Use `COMPLIANT` only when the implementation matches the spec exactly — everything requested is present, nothing unrequested was added. Use `ISSUES` when anything is missing, extra, or misunderstood.

## Rules

- Never modify code — you are read-only
- Never trust the implementer's report — read the actual code
- Never interact with the user — report back to the dispatching agent
- Never manage arc issues — the dispatcher handles arc state
- Flag extras with the same severity as omissions — over-building is a spec violation
- Format all arc content (descriptions, comments) using GFM: fenced code blocks with language tags, headings for structure, lists for organization, inline code for paths/commands
````

- [ ] **Step 3: Replace the implementer's orient-first opening with Claude's scope-discipline rules and the extra-work gate**

Replace the opening section in `codex-marketplace/plugins/arc/agents/arc-implementer.md` with:

```md
## Scope Discipline

**Build ONLY what the task specifies.** If a step has a code block, implement that behavior following the code block's structure and patterns, adapted to project conventions. Do not add features, flags, utilities, helpers, or improvements the task didn't ask for.

- **If you discover a blocking prerequisite is missing** (a dependency doesn't exist, a required type isn't on HEAD, a file the task references doesn't exist) — report `NEEDS_CONTEXT` with what's missing. Do not create the missing prerequisite yourself; it may belong to another task.
- **If you notice non-blocking observations outside your scope** (adjacent code smells, potential improvements, growing file size) — complete your work and report `DONE_WITH_CONCERNS`. The orchestrator will triage.
- **Do not refactor code outside your task's `## Files` section**, even if you see obvious improvements. Your scope is your scope.
- **If a step is vague or ambiguous**, report `NEEDS_CONTEXT` rather than filling in gaps with your own engineering judgment.
- **If the task seems incomplete** (e.g., it builds a function but doesn't wire it up), that's intentional — wiring may be another task. Implement what's specified and report back.
```

Then insert this block immediately after `**If any step is missing**: implement it now (RED → GREEN → REFACTOR for each gap).`:

```md
Then check for **extra** work beyond the spec:

- Did you create files not listed in the task's `## Files` section?
- Did you add functions, methods, types, CLI flags, or config options not described in `## Steps`?
- Did you modify files outside the `## Scope Boundary`?
- Did you add error handling, logging, or utilities the task didn't ask for?

**If any extras found**: remove them. The task specifies what to build — anything beyond that is out of scope, even if it seems helpful.
```

- [ ] **Step 4: Expand the implementer report format to the four-state contract**

Update the rationalizations, workflow, and report-format sections so they contain these exact additions:

```md
| "This will be needed later" | If it's not in the spec, it's not your job. Note it as a concern and move on. |
| "This is cleaner if I also refactor X" | Your scope is your scope. Report `DONE_WITH_CONCERNS` if it's worth noting. |
| "The task needs Y to actually work end-to-end" | Maybe — but Y might be another task. If Y is a missing prerequisite, report `NEEDS_CONTEXT`. If it's adjacent work, report `DONE_WITH_CONCERNS`. |
| "I'll add a helper since this pattern repeats" | The task didn't ask for a helper. Implement the behavior the task specified. |
```

```md
## Result: PASS | PARTIAL | NEEDS_CONTEXT | DONE_WITH_CONCERNS
```

```md
### Context Needed (only if NEEDS_CONTEXT)
- <what is missing or ambiguous>
- <what you need from the orchestrator to proceed>

### Concerns (only if DONE_WITH_CONCERNS)
- <concern 1: what you noticed and why it may need a separate task>
```

```md
Use `PASS` when all gate checks pass. Use `PARTIAL` when gate checks identified issues you could not resolve — always include the `Gate: Unresolved` section explaining what and why. Use `NEEDS_CONTEXT` when you cannot complete the task due to ambiguity or missing prerequisites — include a `## Context Needed` section. Use `DONE_WITH_CONCERNS` when all gate checks pass but you identified non-blocking issues **outside your task scope** — include a `## Concerns` section.
```

- [ ] **Step 5: Verify the new agent exists and the implementer contract now matches the approved result model**

Run: `rg -n "NEEDS_CONTEXT|DONE_WITH_CONCERNS|### Context Needed|### Concerns|If any extras found" codex-marketplace/plugins/arc/agents/arc-implementer.md && test -f codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md`

Expected: all five matches print from `arc-implementer.md`, and the file-existence check succeeds.

Run: `git diff --no-index -- claude-marketplace/plugins/arc/agents/arc-implementer.md codex-marketplace/plugins/arc/agents/arc-implementer.md`

Expected: only intentional Codex-specific frontmatter or tool-surface differences remain.

- [ ] **Step 6: Commit the new agent and implementer-agent contract**

```bash
git add codex-marketplace/plugins/arc/agents/arc-implementer.md codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md
git commit -m "docs(arc): add codex spec reviewer contract"
```

### Task 3: Rewire the Implement and Review Skills Around the New Contract

**Files:**
- Modify: `codex-marketplace/plugins/arc/skills/implement/SKILL.md:88-235`
- Modify: `codex-marketplace/plugins/arc/skills/review/SKILL.md:46-130`
- Reference: `claude-marketplace/plugins/arc/skills/implement/SKILL.md`
- Reference: `claude-marketplace/plugins/arc/skills/review/SKILL.md`
- Reference: `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md`

- [ ] **Step 1: Prove the implement and review skills still lack the new wiring**

Run:

```bash
if rg -n "arc-spec-reviewer|## Evaluator Status|DONE_WITH_CONCERNS|NEEDS_CONTEXT" codex-marketplace/plugins/arc/skills/implement/SKILL.md codex-marketplace/plugins/arc/skills/review/SKILL.md; then
  exit 1
fi
```

Expected: exit code `0`, confirming the orchestration contract has not yet been updated.

- [ ] **Step 2: Upgrade the implement-skill dispatch prompt and result triage to use the four-state report model**

In `codex-marketplace/plugins/arc/skills/implement/SKILL.md`, replace the current scope-rules block with:

```md
## Scope Rules
- Build ONLY what the task specifies. Follow code blocks' structure and behavior, adapted to project conventions.
- Do NOT add features, flags, helpers, or improvements not in the task.
- Do NOT modify files outside the `## Files` section.
- If a prerequisite is missing (type, file, dependency not on HEAD), return `NEEDS_CONTEXT` and document it in `### Context Needed`.
- If a step is vague, return `NEEDS_CONTEXT` and document the ambiguity in `### Context Needed` — do not fill in gaps with your judgment.
- If you notice non-blocking issues outside your scope, return `DONE_WITH_CONCERNS` and document them in `### Concerns`.
```

Then replace the result-handling section so it contains these exact branches:

```md
**If `NEEDS_CONTEXT`** (implementer hit ambiguity or missing prerequisite):
- Read the `### Context Needed` section
- If the issue is a missing prerequisite, fix dependency ordering or provide the missing definition before re-dispatching
- If the issue is task ambiguity, clarify the task before re-dispatching

**If `DONE_WITH_CONCERNS`** (work complete, non-blocking observations):
- Read the `### Concerns` section
- Note the concern on the epic or task, then continue to reviewer/spec-reviewer/evaluator dispatch
```

- [ ] **Step 3: Add the spec-reviewer dispatch and three-way triage to the implement skill**

Update step 5 and step 6 of `codex-marketplace/plugins/arc/skills/implement/SKILL.md` so they include these exact blocks:

```md
### 5. Dispatch Evaluation and Review (Parallel)

After confirming tests pass, dispatch the reviewer, spec reviewer, and evaluator **simultaneously** for normal code tasks.
```

````md
**Agent 2 — `arc-spec-reviewer`** (exact task compliance and scope-boundary checking):

```
Verify this implementation matches its specification exactly.

## Task Spec
<paste output of: arc show <task-id>>

## Base SHA
<BASE_SHA> (use for: git diff --name-only <BASE_SHA>..HEAD)
```
````

```md
**Agent 3 — `arc-reviewer`** (code quality and plan adherence):

Invoke the `review` skill as before — it dispatches the `arc-reviewer` with the diff, task spec, design spec, and evaluator status.
```

```md
#### Spec reviewer findings (exact task compliance)

| Finding | Action |
|---------|--------|
| **COMPLIANT** | Proceed to the other checks. |
| **ISSUES (Missing)** | Re-dispatch `arc-implementer` with the missing requirements. Re-run the spec reviewer after fixes. |
| **ISSUES (Extra)** | Re-dispatch `arc-implementer` to remove the out-of-scope work. Re-run the spec reviewer after fixes. |
| **ISSUES (Misunderstood)** | Re-dispatch `arc-implementer` with the exact misunderstanding and the intended reading of the task. Re-run the spec reviewer after fixes. |
```

```md
If reviewer, spec reviewer, and evaluator disagree, resolve in this order:

1. evaluator for spec-intent behavior
2. spec reviewer for exact task compliance
3. reviewer for code quality and conventions
```

Keep the docs-only note aligned with the approved design:

```md
> **Note**: For `docs-only` tasks, skip the evaluator entirely. Use the reviewer and spec reviewer only when the task changes developer-facing workflow docs, command docs, or other documentation that materially affects how `arc` is used.
```

- [ ] **Step 4: Make the review skill evaluator-aware**

In `codex-marketplace/plugins/arc/skills/review/SKILL.md`, update the reviewer dispatch prompt to include:

```md
## Evaluator Status
<active | not dispatched>
```

Then replace the evaluator-relationship section with:

```md
## Relationship to the Evaluator

The evaluator is **not always present**. Your dispatch prompt includes an `## Evaluator Status` line that tells you whether the evaluator is running for this task.

**When Evaluator Status is `active`** (high-risk tasks):

The evaluator runs in parallel with you. Your concerns are complementary:

| | Reviewer (you) | Evaluator |
|---|---|---|
| **Focus** | Code quality, conventions, plan adherence | Spec-intent compliance via independent testing |
| **Input** | Git diff + spec | Spec only (no diff) |
| **Modifies code?** | No | Writes ephemeral acceptance tests, then deletes them |

Focus on code quality, naming, structure, conventions, and plan adherence. Defer behavioral verification to the evaluator's actual tests.

**When Evaluator Status is `not dispatched`** (default path):

You are the only reviewer. In addition to code quality and plan adherence, **flag behavioral concerns** — code paths that look like they might not match the spec, edge cases that appear unhandled, logic that seems inconsistent with the task's `## Expected Outcome`. Describe the suspected behavior gap and the code path involved so the orchestrator can decide whether to escalate to the evaluator.

You are not expected to write or run tests — that's still the evaluator's job if escalated. But you should flag what you see.
```

Finish by replacing the final rule with:

```md
- Focus on code quality and conventions. Flag behavioral concerns when no evaluator is present.
```

- [ ] **Step 5: Verify the new orchestration wiring end to end**

Run: `rg -n "arc-spec-reviewer|Spec reviewer findings|DONE_WITH_CONCERNS|NEEDS_CONTEXT" codex-marketplace/plugins/arc/skills/implement/SKILL.md`

Expected: matches for all four phrases.

Run: `rg -n "## Evaluator Status|not dispatched|behavioral concerns" codex-marketplace/plugins/arc/skills/review/SKILL.md`

Expected: matches for all three phrases.

Run: `git diff --no-index -- claude-marketplace/plugins/arc/skills/review/SKILL.md codex-marketplace/plugins/arc/skills/review/SKILL.md`

Expected: the diff should now be limited to the intentional Codex additions for `arc-spec-reviewer` wiring and the richer implementer result model.

- [ ] **Step 6: Commit the orchestrator wiring**

```bash
git add codex-marketplace/plugins/arc/skills/implement/SKILL.md codex-marketplace/plugins/arc/skills/review/SKILL.md
git commit -m "docs(arc): wire codex spec review flow"
```

### Task 4: Final Verification and Release Metadata

**Files:**
- Inspect only: `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
- Inspect only: `codex-marketplace/plugins/arc/skills/debug/SKILL.md`
- Modify: `codex-marketplace/plugins/arc/CHANGELOG.md:3-10`
- Modify: `codex-marketplace/plugins/arc/version.txt:1-1`
- Modify: `codex-marketplace/plugins/arc/.codex-plugin/plugin.json:3-3`

- [ ] **Step 1: Verify the optional `brainstorm` and `debug` sync candidates do not need new edits**

Run:

```bash
git diff --no-index -- claude-marketplace/plugins/arc/skills/brainstorm/SKILL.md codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md
git diff --no-index -- claude-marketplace/plugins/arc/skills/debug/SKILL.md codex-marketplace/plugins/arc/skills/debug/SKILL.md
```

Expected: if diffs remain, they should reflect Codex already carrying the desired wording rather than a missing approved change. Leave both files untouched unless this command reveals a clearly missing portability improvement.

- [ ] **Step 2: Rewrite the top changelog entry to describe the shipped Codex sync accurately**

Replace the top `0.7.1` section in `codex-marketplace/plugins/arc/CHANGELOG.md` with:

```md
## [0.7.1] - 2026-04-21

### Features

- add `arc-spec-reviewer` for exact task-compliance checks in the Codex `arc` workflow
- dispatch spec review alongside reviewer and evaluator in the Codex `implement` flow

### Fixes

- finish syncing Claude `arc` planning wording into the Codex `plan` skill, including the stronger anti-placeholder explanation and self-review loop
- adopt the richer `PASS | PARTIAL | NEEDS_CONTEXT | DONE_WITH_CONCERNS` contract in the Codex implementer and implement orchestrator
- make the Codex `review` skill explicit about evaluator-active vs evaluator-not-dispatched behavior
```

- [ ] **Step 3: Align the shipped version metadata to `0.7.1`**

Set `codex-marketplace/plugins/arc/version.txt` to:

```text
0.7.1
```

Set the `version` field in `codex-marketplace/plugins/arc/.codex-plugin/plugin.json` to:

```json
"version": "0.7.1"
```

- [ ] **Step 4: Run the final shared-core and release-metadata verification commands**

Run: `cat codex-marketplace/plugins/arc/version.txt && jq -r '.version' codex-marketplace/plugins/arc/.codex-plugin/plugin.json`

Expected: both commands print `0.7.1`.

Run: `rg -n "arc-spec-reviewer|NEEDS_CONTEXT|DONE_WITH_CONCERNS|## Evaluator Status" codex-marketplace/plugins/arc/agents codex-marketplace/plugins/arc/skills`

Expected: matches in the new agent file, `agents/arc-implementer.md`, `skills/implement/SKILL.md`, and `skills/review/SKILL.md`.

Run: `git status --short`

Expected: only the planned `codex-marketplace/plugins/arc/**` files are modified before the final commit.

- [ ] **Step 5: Commit the release metadata and final verification pass**

```bash
git add codex-marketplace/plugins/arc/CHANGELOG.md codex-marketplace/plugins/arc/version.txt codex-marketplace/plugins/arc/.codex-plugin/plugin.json
git commit -m "chore(arc): finalize codex selective sync release notes"
```

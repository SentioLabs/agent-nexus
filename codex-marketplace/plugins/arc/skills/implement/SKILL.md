---
name: implement
description: You MUST use this skill to execute implementation tasks from an arc plan — especially when the user says "implement this", "build this", "execute the plan", "start coding", or wants to dispatch subagents for TDD execution of arc issues. The main agent orchestrates; it never writes implementation code directly. Always prefer this over generic implementation when the project uses arc issue tracking.
---

# Implement — Subagent-Driven TDD Execution

Orchestrate task implementation by dispatching fresh `arc-implementer` subagents per task. Each subagent gets a clean context window with just the task description.

## Core Rule

**The main agent NEVER writes implementation code.** It orchestrates, dispatches, and reviews. If you're tempted to "just quickly fix this" — dispatch a subagent instead.

## Dispatch Modes

### Sequential (default)

Tasks are dispatched one at a time through the orchestration loop below. Use this for:
- Most workflows — it's the safe default
- Tasks with any file overlap
- Tasks with dependency ordering (`blocks`/`blockedBy`)
- When you're unsure whether tasks are independent

### Parallel

Multiple tasks dispatched simultaneously using `isolation: "worktree"`. Use this **only** when ALL of these are true:
- 3+ independent tasks remain
- No shared files between any tasks in the batch
- No `blocks`/`blockedBy` dependencies between tasks in the batch
- Each task's scope is clearly defined with no ambiguity

**When NOT to use parallel**: overlapping files, task dependencies, uncertainty about scope, fewer than 3 tasks. Default to sequential — the cost of serial execution is time; the cost of a bad parallel merge is data loss.

## Orchestration Loop

By default, use sequential dispatch. For independent tasks, see [Parallel Dispatch Protocol](#parallel-dispatch-protocol) below.

**Task tracking**: At the start of implementation, create a task list using `TaskCreate` with one entry per arc issue to implement. This provides the orchestrator's visible progress tracker in the CLI. Update each task as you work:
- `in_progress` when dispatching the subagent
- `completed` when the task is closed in arc

```bash
# Get the list of tasks to implement
arc list --parent=<epic-id> --status=open --json
```

Create a `TaskCreate` entry for each, then work through this loop:

### 1. Find Next Task

```bash
arc ready
# or for a specific epic:
arc list --parent=<epic-id> --status=open
```

### 2. Claim Task

```bash
arc update <task-id> --take
```

### 3. Dispatch Agent

Record the current HEAD before dispatching — needed for review if escalated:

```bash
PRE_TASK_SHA=$(git rev-parse HEAD)
```

Check whether the task has a `docs-only` label:

```bash
arc show <task-id> --json | jq -e '.labels[] | select(. == "docs-only")' > /dev/null 2>&1
```

**If `docs-only`** (exit code 0) — spawn an `arc-doc-writer` subagent:

```
Write/update the documentation described in this task.

## Task
<paste output of: arc show <task-id>>

Verify formatting quality and commit your work.
```

**Otherwise** — spawn an `arc-implementer` subagent:

```
Implement this task following TDD (RED → GREEN → REFACTOR → GATE).

## Task
<paste output of: arc show <task-id>>

## Context
State the parent epic, completed prerequisite tasks, and any shared files or types that are already on HEAD.

## Project Test Command
<project's test command, e.g., make test, go test ./...>

## Scope Rules
- Build ONLY what the task specifies. Follow code blocks' structure and behavior, adapted to project conventions.
- Do NOT add features, flags, helpers, or improvements not in the task.
- Do NOT modify files outside the `## Files` section.
- If a prerequisite is missing (type, file, dependency not on HEAD), report `NEEDS_CONTEXT` and document it in `### Context Needed`.
- If a step is vague, report `NEEDS_CONTEXT` and document the ambiguity in `### Context Needed` — do not fill in gaps with your judgment.
- If you notice non-blocking issues outside your scope, report `DONE_WITH_CONCERNS` and document them in `### Concerns`.

Commit your work when all gate checks pass.
```

### 4. Evaluate Result

When the subagent reports back, check the **Result** and **Gate Results** in its report:

- `PASS`, `PARTIAL`, and `DONE_WITH_CONCERNS` should include gate results because the implementer reached or completed the gate.
- `NEEDS_CONTEXT` may report `Gate Results: NOT RUN (blocked by context)` because the implementer could not reach the gate. In that case, the required follow-up section is `### Context Needed`.

**If `PASS`** (all gate checks passed):
- Run the project test command fresh yourself to confirm — do NOT trust the subagent's report alone
- If tests pass → proceed to step 5 (Dispatch Verification)

**If `PARTIAL`** (gate identified unresolved implementation issues):
- Read the `Gate: Unresolved` section carefully
- Decide: is this a re-dispatch or a debug situation?
- Handle issues before proceeding (see below)

**If `NEEDS_CONTEXT`** (missing prerequisite or task ambiguity):
- Expect `Gate Results: NOT RUN (blocked by context)` or equivalent wording
- Read the `### Context Needed` section
- If the issue is a missing prerequisite (type, file, dependency not on HEAD) → fix dependency ordering, provide the missing definition, or create a follow-up issue if the plan is incomplete
- If the issue is task ambiguity → clarify the task and re-dispatch with the clarification
- Do NOT re-dispatch without addressing the context gap — the implementer will hit the same wall again

**If `DONE_WITH_CONCERNS`** (work complete, all gate checks passed, but out-of-scope concerns were noted):
- Read the `### Concerns` section
- Note the concerns on the task or epic for follow-up without expanding current scope
- Run the project test command fresh yourself to confirm
- If tests pass → proceed to step 5 (Dispatch Verification)

**If a `PASS`, `PARTIAL`, or `DONE_WITH_CONCERNS` report did not include gate results** (it skipped the gate):
- Treat this as a failed result — re-dispatch with explicit reminder to complete all gate checks

**Handling issues from `PARTIAL` results**:

- **Subagent reports `PARTIAL` with clear gaps** — re-dispatch `arc-implementer` with the specific gaps listed in `Gate: Unresolved`, plus the original task description
- **Subagent reports test failures it can't resolve** — invoke the `debug` skill
- **3+ implementation attempts fail on same issue** — invoke the `debug` skill
- **Approach was wrong** — re-dispatch the appropriate agent with corrected guidance

When re-dispatching, include the previous gate feedback so the implementer knows exactly what to fix:

```
Continue implementing this task. A previous attempt was made but the gate check identified issues.

## Task
<paste output of: arc show <task-id>>

## Previous Gate Feedback
<paste the Gate: Unresolved section from the previous report>

## Project Test Command
<project's test command>

Fix the identified issues, re-run all gate checks, and commit when complete.
```

### 5. Dispatch Verification (Parallel)

After confirming tests pass, collect shared review context once:

```bash
PARENT=$(arc show <task-id> --json | jq -r '.parent_id // empty')
BASE_SHA=$PRE_TASK_SHA
HEAD_SHA=$(git rev-parse HEAD)
```

**Normal code tasks**: In a single response, dispatch all three verification agents in parallel:

- `arc-reviewer` for code quality and conventions. Use the `review` skill or dispatch `arc-reviewer` directly with `## Evaluator Status` set to `active`.
- `arc-spec-reviewer` for exact task compliance and scope-boundary checking:

```
Verify this implementation matches its specification exactly.

## Task Spec
<paste output of: arc show <task-id>>

## Implementer Report
<paste the implementer's report>

## Base SHA
<BASE_SHA> (use for: git diff --name-only <BASE_SHA>..HEAD)
```

- `arc-evaluator` for adversarial spec-intent verification, **dispatched with `isolation: "worktree"`**:

The evaluator runs in a worktree so it can freely write acceptance tests and add dependencies without dirtying the main working tree. The worktree is automatically discarded when the agent finishes.

```
Evaluate whether this implementation faithfully satisfies the spec. Write your own acceptance tests from the spec alone — do NOT read the implementer's tests or the git diff.

## Task Spec
<paste output of: arc show <task-id>>

## Design Spec
<paste the design excerpt relevant to this task — from the epic's plan>
If no design spec is available, omit this section entirely.

## Base SHA
<BASE_SHA> (use for: git diff --name-only <BASE_SHA>..HEAD to find changed files)

## Project Test Command
<project's test command, e.g., make test, go test ./...>
```

**Docs-only tasks**:
- Skip the evaluator entirely.
- Dispatch `arc-reviewer` and `arc-spec-reviewer` only when the task changes developer-facing workflow docs, command docs, or other documentation that materially affects how `arc` is used.
- When dispatching `arc-spec-reviewer` for docs-only work, use a docs-specific handoff that matches `arc-doc-writer` output and the changed documentation paths:

```
Verify this documentation change matches its specification exactly.

## Task Spec
<paste output of: arc show <task-id>>

## Doc Writer Report
<paste the arc-doc-writer report, if available>
If no report is available, say so and rely on the changed doc paths plus diff.

## Changed Doc Paths
<paste output of: git diff --name-only <BASE_SHA>..HEAD>

## Documentation Diff
<paste output of: git diff <BASE_SHA>..<HEAD_SHA> -- <doc-paths>>
```

- For docs-only tasks that do **not** materially affect how `arc` is used, verify formatting/completeness directly and proceed without reviewer/spec-reviewer dispatch.
- When reviewing a docs-only task, set the review skill's `## Evaluator Status` to `not dispatched`.

### 6. Triage Findings

Reviewer, spec reviewer, and evaluator report back independently. Triage their findings together. Any fix that changes code should send you back to step 5 so the full verification set runs again. For docs-only tasks, re-run only the checks that were actually dispatched.

#### Reviewer findings (code quality)

| Finding | Action |
|---------|--------|
| **Critical/Important** | Re-dispatch `arc-implementer` with fixes. Re-review after. |
| **Minor** | Note in arc comment. Proceed. |
| **Deviation (fix)** | Re-dispatch `arc-implementer` to match the design. |
| **Deviation (accept)** | Log as arc comment: "Accepted deviation: \<description\>. Rationale: \<why\>." Proceed. |

For accepted deviations, the orchestrator decides — not the reviewer. If unsure whether a deviation is an improvement, default to fixing it to match the plan.
For docs-only tasks, route reviewer-requested fixes to `arc-doc-writer` instead of `arc-implementer`, then re-run only the dispatched docs checks from step 5.

#### Spec reviewer findings

| Finding | Action |
|---------|--------|
| **COMPLIANT** | Exact task compliance confirmed. Proceed. |
| **ISSUES (Missing)** | Re-dispatch `arc-implementer` with the missing requirements called out by the spec reviewer. Re-run step 5 after the fix. |
| **ISSUES (Extra)** | Re-dispatch `arc-implementer` to remove the extra work and restore scope discipline. Re-run step 5 after the fix. |
| **ISSUES (Misunderstood)** | Re-dispatch `arc-implementer` with the misread requirement plus the corrected interpretation. Re-run step 5 after the fix. |

For docs-only tasks, route spec-reviewer-requested fixes to `arc-doc-writer` instead of `arc-implementer`, then re-run only the dispatched docs checks from step 5.

#### Evaluator findings

| Finding | Action |
|---------|--------|
| **PASS** | Evaluator confirms spec compliance independently. Proceed. |
| **CONCERNS** (edge cases / minor gaps) | Note findings in arc comment. Decide: fix now or defer. |
| **FAIL — Implementation Health** | The project doesn't build or existing tests fail. This is a real implementer bug — re-dispatch `arc-implementer` with the build/test failure. |
| **FAIL — Spec-Intent Gap** | Re-dispatch `arc-implementer` with the evaluator's finding. Include what the spec says, what the evaluator expected, and what actually happened. Re-evaluate after. |
| **FAIL — Missing Behavior** | Re-dispatch `arc-implementer` with the missing behavior. Re-evaluate after. |
| **BLOCKED** | The evaluator's own test setup failed (compilation, dependency resolution). This is NOT an implementer problem. Do NOT re-dispatch the implementer. Note in arc comment and proceed — the evaluator's verdict is inconclusive for this task. |
| **Untestable Requirement** | This may indicate an incomplete public API. Assess whether the interface needs expansion and re-dispatch if so. |

#### Conflict resolution

If the checks disagree on the same question, resolve them in this order:

1. **Evaluator** for spec-intent behavior
2. **Spec reviewer** for exact task compliance
3. **Reviewer** for code quality and conventions

Use the highest-ranked source that speaks directly to the disputed issue, then keep the lower-ranked findings in their own domain.

#### Circuit breaker

If 3 verify/fix cycles on the same finding haven't resolved it, STOP. The evaluator or spec reviewer may be exposing a real ambiguity in the task. Escalate to the user with the competing interpretations and the evidence behind them.

### 7. Close Task

```bash
arc close <task-id> -r "Implemented: <summary>"
```

### 8. Integration Checkpoint

After closing 2-3 related tasks, or before switching to a new epic phase, run the full integration test suite:

```bash
make test-integration
```

This catches cross-task regressions that individual implementer gate checks won't — each implementer only validates its own task's scope. Do not wait until all tasks are complete to discover integration failures.

If integration tests fail:
- Identify which task's changes caused the failure
- Re-dispatch `arc-implementer` with the failing test details and the relevant task context
- If the failure spans multiple tasks, invoke the `debug` skill

### 9. Repeat

Go to step 1 for the next task. Continue until all tasks in the epic are closed.

## Parallel Dispatch Protocol

When you have identified a batch of truly independent tasks (see [Dispatch Modes](#dispatch-modes)), switch from the sequential loop to this protocol:

### P1. Commit Checkpoint

Before switching to parallel, ensure all sequential work is committed and pushed:

```bash
git status          # Must be clean — no unstaged or uncommitted changes
git log -3          # Verify recent sequential commits are present
git push            # Establish a recovery point on the remote
```

**Hard gate**: Do NOT proceed if `git status` shows uncommitted changes.

### P2. Record HEAD Anchor

```bash
PARALLEL_BASE=$(git rev-parse HEAD)
echo "Parallel base: $PARALLEL_BASE"
```

This is the baseline all worktrees will branch from. Record it — you'll need it for verification after merge.

### P3. Verify Independence

For each task in the planned parallel batch:

```bash
arc show <task-id>
```

Confirm:
- No `blocks`/`blockedBy` relationships between tasks in this batch
- No overlapping file paths in task descriptions
- Each task has a clearly scoped, non-ambiguous specification

If any task fails these checks, remove it from the parallel batch and handle it sequentially after.

### P4. Dispatch in Single Turn

All parallel Agent tool calls with `isolation: "worktree"` **must happen in the same orchestrator message**. This ensures they all branch from the same HEAD.

```
# In a single response, dispatch all parallel tasks:
Agent(subagent_type="arc-implementer", isolation="worktree", prompt="Task 1...")
Agent(subagent_type="arc-implementer", isolation="worktree", prompt="Task 2...")
Agent(subagent_type="arc-implementer", isolation="worktree", prompt="Task 3...")
```

**Never** dispatch worktree agents across multiple turns — HEAD may move between turns, causing stale branches.

### P5. Merge-Back Verification

After all parallel agents report back, verify the merge did not lose work:

```bash
# 1. Check HEAD against the recorded anchor
git log --oneline $PARALLEL_BASE..HEAD    # Should show ONLY the parallel agents' commits

# 2. Verify sequential commits are still in history
git log --oneline HEAD | head -20         # All prior sequential commits must be present

# 3. Run full test suite
make test    # or project-specific test command
```

**If sequential commits are missing** → STOP. Do not continue. Recover from reflog:

```bash
git reflog                                # Find the pre-merge state
git log --oneline <reflog-ref>            # Verify it has the missing commits
# Cherry-pick or reset as appropriate — ask user if unsure
```

### P6. Resume Sequential

After successful verification, return to the normal orchestration loop (step 1) for any remaining tasks.

## When to Invoke Debug

- Subagent reports test failures it can't resolve after reasonable effort
- 3+ implementation attempts fail on the same issue
- A regression appears that isn't explained by the current task's changes

## Arc Commands Used

```bash
arc ready                           # Find next task
arc update <id> --take                  # Claim task (sets session ID + in_progress)
arc show <id>                        # Get task description for subagent
arc close <id> -r "reason"            # Close completed task
```

## Rules

- Never write implementation code as the main agent — always dispatch
- Never close a task without confirming tests pass yourself (fresh run)
- Never close a task if the implementer reported `PARTIAL` without re-dispatching
- If in doubt about the result, re-dispatch rather than fixing manually
- Never dispatch parallel agents without committing and pushing all sequential work first
- Never dispatch parallel agents on tasks that share files
- Never proceed after parallel merge without verifying commit history against the recorded HEAD anchor
- Never mix sequential and parallel dispatch in the same batch — finish one mode before switching to the other
- Format all arc content (descriptions, plans, comments) per `skills/arc/_formatting.md`

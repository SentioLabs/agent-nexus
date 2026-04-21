---
name: arc-implement
description: Use when executing planned arc implementation tasks in OpenCode, especially when the user says to implement a task, continue coding, or run the subagent workflow. Use this instead of direct coding when work should flow through arc-implementer, arc-reviewer, arc-evaluator, or arc-doc-writer.
---

# Arc Implement

Run arc implementation as explicit orchestrator work. The main agent manages task state, dispatches named OpenCode subagents, and decides whether another pass is required. The main agent does not write the task implementation directly.

## Core Rule

**Orchestrate first, dispatch second, edit code never.** If work needs to be built, reviewed, or accepted, start a named OpenCode subagent task for the correct agent, pass the task/design/test context in that dispatch, and wait for a structured result before continuing.

This skill starts from tracked work that already exists. Use `arc ready` and `arc show <task-id>` to select work; do not create issues or infer ad hoc work that bypassed `arc-plan`.

## Default Mode

Use a sequential workflow unless the user explicitly asks for something else and the runtime clearly supports it. Do not rely on worktree isolation, `isolation: "worktree"`, or Codex-only tool names.

## Orchestration Loop

### 1. Create or Update the Todo List

Before dispatching anything, create or refresh a short todo list for the current task batch. Keep one entry per arc task and update it as work moves through implementation, review, and acceptance.

Minimum statuses:
- `pending` before dispatch
- `in_progress` while a subagent is working
- `needs_fix` when findings require another pass
- `done` after review and acceptance are clear

### 2. Find and Claim the Task

Use arc to identify the next unblocked task and claim it:

```bash
arc ready
arc update <task-id> --take
arc show <task-id>
```

Record the current commit before dispatching so later review has a stable base:

```bash
PRE_TASK_SHA=$(git rev-parse HEAD)
```

### 3. Check for `docs-only`

If the task is documentation-only, do not send it through the full code path.

```bash
arc show <task-id> --json | jq -e '.labels[] | select(. == "docs-only")' > /dev/null 2>&1
```

If the label is present, dispatch `arc-doc-writer` with the task description and skip the evaluator path. Use `arc-reviewer` only when the docs change is substantial enough to benefit from a second pass, such as broad restructuring or operator-facing behavior changes. Do not dispatch `arc-implementer` for docs-only work.

Dispatch prompt shape:

```text
Write or update the documentation described below.

## Task
<paste output of: arc show <task-id>>

Stay within the listed files, verify formatting quality, and report back with files changed and checks performed.
```

OpenCode dispatch shape:

```text
Start a named subagent/task using agent `arc-doc-writer`.
Pass the full prompt above plus the pasted `arc show <task-id>` output.
Expect back: `PASS`, `PARTIAL`, or `NEEDS_CONTEXT`, followed by files changed and checks performed.
```

### 4. Dispatch `arc-implementer`

For non-docs work, dispatch `arc-implementer` with the full task spec and project test command.

Dispatch prompt shape:

```text
Implement this task using TDD.

## Task
<paste output of: arc show <task-id>>

## Context
Parent issue, completed prerequisites, and any already-landed shared types or files.

## Project Test Command
<project test command>

## Scope Rules
- Build only what the task specifies.
- Stay inside the task's scoped files.
- If a prerequisite is missing or the task is ambiguous, report `NEEDS_CONTEXT`.
- If non-blocking issues are noticed outside scope, report `DONE_WITH_CONCERNS`.

Commit only after your gate passes.
```

OpenCode dispatch shape:

```text
Start a named subagent/task using agent `arc-implementer`.
Pass the full prompt above, including the pasted task output, context, and project test command.
Expect back: `PASS`, `PARTIAL`, `NEEDS_CONTEXT`, or `DONE_WITH_CONCERNS`, plus a short implementation summary, files changed, tests run, and whether the work was committed.
```

### 5. Triage the Implementation Result

Read the subagent report before doing anything else.

If the result is `PASS`:
- Run the project test command yourself.
- If that passes, continue to review and acceptance.

If the result is `PARTIAL` or `NEEDS_CONTEXT`:
- Read the unresolved or missing-context section closely.
- Fix missing prerequisites or clarify the task before dispatching again.
- Re-dispatch `arc-implementer` only with the specific gaps called out.

If the result is `DONE_WITH_CONCERNS`:
- Preserve the concern in task notes.
- Continue if the in-scope work is complete and verified.

If the gate was skipped or the report is incomplete:
- Treat it as a failed pass.
- Re-dispatch `arc-implementer` with an explicit instruction to complete the full gate.

### 6. Dispatch `arc-reviewer`

After a successful implementation pass, dispatch `arc-reviewer` on the resulting work.

Compute the review input first. Use the committed range when the implementer created one or more commits; otherwise diff the working tree against the pre-task base so the review is not empty.

```bash
BASE_SHA=$PRE_TASK_SHA
HEAD_SHA=$(git rev-parse HEAD)
if [ "$HEAD_SHA" != "$BASE_SHA" ]; then
  git diff $BASE_SHA..$HEAD_SHA
else
  git diff $BASE_SHA
fi
```

If the uncommitted implementation added new files, include those paths from `git status --short` in the review context so the reviewer sees the full task output.

Dispatch prompt shape:

```text
Review these changes for bugs, regressions, missing verification, and plan drift.

## Task Spec
<paste output of: arc show <task-id>>

## Design Spec
<paste relevant design excerpt if available>

## Changes
<paste output of the diff selected by the rule above>

Report findings first with file references. Keep any summary brief and secondary.
```

OpenCode dispatch shape:

```text
Start a named subagent/task using agent `arc-reviewer`.
Pass the task spec, any relevant design excerpt, and the diff produced by the rule above.
Expect back: findings grouped by severity with file references, then a brief summary.
```

### 7. Dispatch `arc-evaluator`

After review is dispatched, dispatch `arc-evaluator` for acceptance. Keep this sequential by default in OpenCode: reviewer first or evaluator first is fine, but do not require simultaneous worktree-based execution.

Dispatch prompt shape:

```text
Evaluate whether this implementation satisfies the task spec from the outside.

## Task Spec
<paste output of: arc show <task-id>>

## Design Spec
<paste relevant design excerpt if available>

## Base SHA
<BASE_SHA>

## Project Test Command
<project test command>
```

For docs-only tasks, skip this step and rely on the documentation result plus optional review.

OpenCode dispatch shape:

```text
Start a named subagent/task using agent `arc-evaluator`.
Pass the task spec, any relevant design excerpt, the base SHA, and the project test command.
Expect back: `PASS`, `CONCERNS`, `FAIL`, or `BLOCKED`, with concise acceptance evidence.
```

### 8. Triage Findings and Decide Whether to Repeat

Another pass happens only when findings require it.

Re-dispatch `arc-implementer` when:
- `arc-reviewer` reports Critical or Important issues
- `arc-reviewer` identifies a design deviation that should be fixed
- `arc-evaluator` reports `FAIL`
- `arc-evaluator` reports `CONCERNS` that the orchestrator decides must be fixed now

Do not re-run the whole loop just because a reviewer noted a Minor issue or because the evaluator was `BLOCKED` by its own setup.

When re-dispatching, include:
- the original task spec
- the specific reviewer or evaluator finding
- the exact file references or failed behaviors
- the same project test command

After fixes, run review again and run acceptance again.

### 9. Close the Task

Once implementation, review, and acceptance are clear for the current task:

```bash
arc close <task-id> --reason "Implemented: <short summary>"
```

Update the todo list entry to `done`, then move to the next ready task.

## Triage Rules

| Source | Result | Action |
|--------|--------|--------|
| `arc-reviewer` | Critical / Important | Re-dispatch `arc-implementer`, then re-review |
| `arc-reviewer` | Minor | Note it, usually proceed |
| `arc-reviewer` | Deviation with `fix` | Re-dispatch `arc-implementer` |
| `arc-reviewer` | Deviation with `accept` | Record rationale, then proceed |
| `arc-evaluator` | `PASS` | Proceed |
| `arc-evaluator` | `CONCERNS` | Decide whether to fix now or defer |
| `arc-evaluator` | `FAIL` | Re-dispatch `arc-implementer`, then re-evaluate |
| `arc-evaluator` | `BLOCKED` | Do not blame the implementer automatically; note the inconclusive acceptance result |

## Circuit Breaker

If the same finding survives three fix cycles, stop and escalate with:
- the task ID
- the repeated finding
- the competing interpretations of the spec
- what evidence each agent produced

## Rules

- Keep the workflow sequential by default.
- Start only from tracked work surfaced by `arc ready`.
- Do not rely on `isolation: "worktree"`.
- Do not use Codex-only task tools or workflow names.
- Do not create issues or infer ad hoc work that bypassed `arc-plan`.
- Use `arc-doc-writer` instead of the full code path for docs-only work; review is optional for substantial docs changes and evaluator is skipped.
- Dispatch `arc-implementer`, then `arc-reviewer`, then `arc-evaluator` in substance for code tasks.
- Repeat only when findings require another pass.
- Format all arc issue content using `skills/arc/_formatting.md`.

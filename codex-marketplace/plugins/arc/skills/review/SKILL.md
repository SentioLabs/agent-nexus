---
name: review
description: You MUST use this skill after implementing a task to get code review — especially when the user says "review this", "check my code", "review the changes", or after any implementation task completes. Dispatches the arc-reviewer agent with git diff and task spec, then triages feedback by severity. Always prefer this over generic code review when the project uses arc issue tracking.
---

# Review — Code Review Dispatch

Dispatch the `arc-reviewer` subagent to review implementation work, then triage findings.

## Workflow

Create a `TodoWrite` checklist with these steps for standalone review work. If this review is running inside the implement skill's verification fan-out, reuse the implement orchestrator's existing `TaskCreate` item instead of creating parallel tracking.

### 1. Get Git SHAs

Use the `PRE_TASK_SHA` recorded by the implement skill before dispatching the implementer:

```bash
BASE_SHA=$PRE_TASK_SHA
HEAD_SHA=$(git rev-parse HEAD)
```

If `PRE_TASK_SHA` is not available (e.g., standalone review), determine the range manually:

```bash
# Check recent commits to identify where the task's work begins
git log --oneline -10
# Set BASE_SHA to the commit before the task's first change
BASE_SHA=$(git rev-parse <commit-before-task>)
HEAD_SHA=$(git rev-parse HEAD)
```

### 2. Get Design Context

If the review was invoked from the implement skill, a design excerpt should be available. Retrieve it:

```bash
# Get the parent epic of this task
arc show <task-id> --json | jq -r '.parent_id // empty'
# If parent exists, get the epic's plan content
arc show <parent-epic-id>
```

Extract the design excerpt relevant to this task — typically the sections covering the types, interfaces, and architectural decisions this task implements. If no parent epic exists or no design is available, skip the design spec section in the dispatch prompt.

### 3. Dispatch Reviewer

Use the Agent tool to spawn an `arc-reviewer` subagent with this prompt:

```text
Review these changes against the task spec and project conventions.

## Task Spec
<paste output of: arc show <task-id>>

## Design Spec
<paste the design excerpt relevant to this task — from the epic's plan or the task's ## Design Contracts section>
If no design spec is available, omit this section entirely.

## Changes
<paste output of: git diff <BASE_SHA>..<HEAD_SHA>>

## Evaluator Status
<active | not dispatched>

Report findings as: Critical (must fix), Important (should fix), Minor (note for later).
If a design spec was provided, also report Plan Adherence (ADHERENT or DEVIATION with fix/accept recommendation).
```

### 4. Triage Feedback

When the reviewer reports back:

| Severity | Action |
|----------|--------|
| **Critical** | Fix immediately — re-dispatch `arc-implementer` with the specific fix. Then re-review. |
| **Important** | Fix before moving to next task — re-dispatch `arc-implementer`. Then re-review. |
| **Minor** | Note in arc issue comment for later. Proceed. |
| **Deviation (fix)** | Re-dispatch `arc-implementer` with the specific deviation to correct. |
| **Deviation (accept)** | Note the deviation as an arc comment on the task for traceability. Proceed. |

### 5. Handle Fixes

If fixes are needed:
1. Re-dispatch `arc-implementer` with the specific findings to address
2. After the implementer reports back, re-review (go to step 1 with updated SHAs)
3. Continue until the review is clean (no Critical or Important findings)

**Circuit breaker**: If 3 review/fix cycles on the same task haven't resolved all findings, STOP. Escalate to the user with a summary of what keeps recurring — the reviewer and implementer may disagree on the approach, or the task spec may be ambiguous.

### 6. Return Findings

Return the reviewer findings, severity, and any re-review recommendation to the caller or orchestrator.

- If Critical or Important findings remain, say they require implementer follow-up plus re-review.
- If only Minor findings or accepted deviations remain, say review is complete and the caller can decide the next orchestration step.
- Do not invoke `finish` from this skill and do not decide whether to return to `implement` — that belongs to the caller coordinating the wider workflow.

## Response Discipline

When receiving review feedback from the `arc-reviewer`:

- **Evaluate technically.** Don't agree performatively. If a finding is wrong, explain why with evidence.
- **If it's right, fix it.** Don't negotiate or defer valid Critical/Important findings.
- **If it's ambiguous, flag the ambiguity.** Recommend evaluator escalation or an implementer follow-up test when that would resolve the uncertainty.
- **No ego.** The reviewer is checking the subagent's work, not yours personally.

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

## Contexts

This skill works in both execution models:

| Context | How review works |
|---------|-----------------|
| **Single-agent** | Main agent dispatches `arc-reviewer` subagent |
| **Team mode** | Team lead dispatches QA teammate or `arc-reviewer` subagent |

## Rules

- Always review after implementation — don't skip to close
- Re-review after fixes — don't assume fixes are correct
- The reviewer reports; you decide what to do with the findings
- Never make code changes in the review skill — dispatch the implementer for fixes
- Focus on code quality and conventions. Flag behavioral concerns when no evaluator is present.
- Format all arc content (descriptions, plans, comments) per `skills/arc/_formatting.md`

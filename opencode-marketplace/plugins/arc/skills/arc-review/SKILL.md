---
name: arc-review
description: Use when reviewing work that was implemented for an arc task, especially after arc-implement or when the user asks for a code review of task changes. Use this to dispatch arc-reviewer, inspect bugs and regressions, and triage findings before task closure.
---

# Arc Review

Review task work by dispatching `arc-reviewer`, then triage the result. This skill is for review, not implementation.

## Review Goal

Check the work for:
- bugs
- behavioral regressions
- missing or weak verification
- plan or spec drift

The review output must put findings first, each with a file reference when possible. Summaries stay brief and secondary.

## Workflow

### 1. Determine the Review Range

Prefer the SHA captured before implementation:

```bash
BASE_SHA=$PRE_TASK_SHA
HEAD_SHA=$(git rev-parse HEAD)
```

If implementation work was committed, review `git diff $BASE_SHA..$HEAD_SHA`.

If `HEAD_SHA` is still `BASE_SHA`, the implementer left working-tree edits instead of a commit; review `git diff $BASE_SHA` so tracked staged and unstaged changes are included.

If the uncommitted implementation added new files, include those paths from `git status --short` in the review context so the reviewer does not miss them.

If that value is unavailable, determine the range manually:

```bash
git log --oneline -10
BASE_SHA=$(git rev-parse <commit-before-task>)
HEAD_SHA=$(git rev-parse HEAD)
```

### 2. Gather the Task and Design Context

Retrieve the task spec:

```bash
arc show <task-id>
```

If the task belongs to an epic or has approved design material, retrieve only the relevant design excerpt. The reviewer should compare the implementation against both the task spec and any approved design decisions.

### 3. Dispatch `arc-reviewer`

Dispatch `arc-reviewer` with the task spec, design excerpt if present, and the git diff.

Dispatch prompt shape:

```text
Review these changes for bugs, regressions, missing verification, and design drift.

## Task Spec
<paste output of: arc show <task-id>>

## Design Spec
<paste relevant design excerpt if available>

## Changes
<paste output of the diff selected by the committed-vs-working-tree rule>

Report findings first with file references. Keep the summary brief and secondary.
```

OpenCode dispatch shape:

```text
Start a named subagent/task using agent `arc-reviewer`.
Pass the full prompt above, including the pasted task spec, any design excerpt, and the diff selected by the committed-vs-working-tree rule.
Expect back: findings grouped by severity with file references, then a brief summary.
```

### 4. Evaluate the Review Report

Handle the report in this order:

1. Read all Critical findings.
2. Read all Important findings.
3. Read Minor findings.
4. Read any plan-adherence section.
5. Read the summary last.

Do not start from the summary. The point of this skill is findings first triage.

### 5. Triage by Severity

| Review result | Action |
|---------------|--------|
| Critical | Re-dispatch `arc-implementer` with the exact finding and file references |
| Important | Re-dispatch `arc-implementer` before task closure |
| Minor | Note for later or accept explicitly |
| Deviation with `fix` | Re-dispatch `arc-implementer` to match the approved design |
| Deviation with `accept` | Record the rationale on the task, then proceed |

When fixes are needed, send the finding back with concrete evidence:
- the file reference
- what behavior or verification is missing
- why it matters

After fixes land, re-run this review workflow on the updated diff.

### 6. Reviewer Discipline

Treat these as the default review questions:
- Could this change break an existing path?
- Does the task spec require behavior that is untested or only partially tested?
- Is the implementation relying on assumptions the spec does not support?
- Does the code drift from nearby project conventions in a way that increases risk?

### 7. Circuit Breaker

If three review and fix cycles fail to resolve the same finding, stop and escalate with:
- the repeated finding
- the file references involved
- the current implementation response
- the open question that is blocking agreement

## Output Standard

The effective output shape from `arc-reviewer` should be:

```markdown
## Critical
- `path/to/file:line` <problem and why it matters>

## Important
- `path/to/file:line` <problem and why it matters>

## Minor
- `path/to/file:line` <problem and why it matters>

## Plan Adherence
- `ADHERENT` or explicit deviations

## Summary
<brief secondary wrap-up>
```

If there are no findings, say so explicitly and keep the summary short.

## Rules

- Review for bugs, regressions, and missing verification before anything else.
- Keep findings first.
- Include file references whenever the evidence supports them.
- Keep summaries brief and secondary.
- Never make code changes in this skill; send fixes back to `arc-implementer`.
- Format all arc issue content using `skills/arc/_formatting.md`.

---
name: arc-finish
description: Use when wrapping up arc-tracked work in OpenCode, especially at session end or when deciding whether to close, defer, commit, push, or hand off work while keeping issue and branch state accurate.
---

# Arc Finish

Close out work by checking what remains, making one decision at a time, and leaving arc and git in a truthful state.

## Core Rule

**Do not perform close-out actions by habit. Verify the current state first, then ask for the next decision when needed.**

## Close-Out Protocol

### 1. Verify remaining work

- Review the task goal, current implementation state, and latest verification evidence.
- Confirm what is done, what is still open, and what follow-up work should be captured separately.
- If completion is not yet proven, do not present the work as ready to close.

### 2. Keep arc state truthful

- Close the issue only when the task is actually complete.
- Leave it open or move it to the truthful status when work remains.
- Record concise factual notes about what changed, what is verified, and what is still pending.

### 3. Keep branch state truthful

- Distinguish between uncommitted changes, local commits, and pushed commits.
- Do not imply work is landed if it only exists in the working tree or on the local branch.
- If the branch still needs a user decision, say so plainly.

### 4. Ask one native question at a time for close-out decisions

- Ask one question when a real decision is needed, such as whether to close now, create follow-up issues, commit, push, or hand off.
- Keep it native to the current state of the work, not a canned checklist.
- Do not bundle several decisions into one question.

### 5. Execute only the chosen next step

- After the user answers, perform that step and then reassess.
- If another decision remains, ask the next one question after updating the state.

## Red Flags

- Blind always-push behavior
- Closing issues without verified completion
- Saying a branch is clean or landed when it is only local
- Asking multiple close-out decisions at once
- Summarizing remaining work without checking it first

## Arc Notes

- This skill is a truthful close-out decision protocol, not an unconditional push script.
- Use `arc-verify` before any final completion claim.
- Format any arc notes per `skills/arc/_formatting.md`.

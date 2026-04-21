---
name: arc-verify
description: Use before claiming an arc-tracked task is fixed, complete, or ready to close in OpenCode, especially when success depends on test, build, or command output that must be checked fresh.
---

# Arc Verify

Verify every completion claim with a fresh proof command and its full output.

## Core Rule

**No success claim without fresh verification evidence.**

## Gate Sequence

### 1. Identify the proof command

- Choose the command that proves the exact claim.
- Examples:
  - "tests pass" -> the relevant test command
  - "build succeeds" -> the project build command
  - "issue is ready to close" -> the command or output that shows the acceptance condition is met
- If no command can prove the claim directly, say that and report the real state.

### 2. Run it

- Run the full command now.
- Prefer the broadest meaningful check over a hand-picked subset.
- Do not rely on memory, cached output, or another agent's report.

### 3. Read the full output

- Read the complete output, not just the last line.
- Check the exit status, failures, warnings, skipped work, and anything that weakens the claim.
- If output is long, inspect it fully before summarizing it.

### 4. Decide what the output proves

- Confirm whether the output supports the exact statement you want to make.
- Separate partial evidence from complete proof.

### 5. Only then make the claim

- State the result together with the evidence.
- Example: `npm test` exited 0 and reported 128 passed, 0 failed.
- If verification failed, report that directly and return to implementation or debugging.

## Red Flags

- "Should pass"
- "Looks good"
- Claiming success before running the proof command
- Reading only a summary line
- Treating partial output as complete evidence

## Arc Notes

- Close or update arc issues only after verification matches reality.
- Keep issue comments factual and tied to command output.
- Format any arc notes per `skills/arc/_formatting.md`.

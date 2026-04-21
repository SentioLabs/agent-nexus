---
name: arc-debug
description: Use when debugging an arc-tracked task in OpenCode, especially for bugs, failing tests, unexpected behavior, stack traces, or requests to investigate root cause before changing code.
---

# Arc Debug

Debug by proving what is happening before proposing a fix.

## Core Rule

**No fixes without root cause investigation first.**

If the problem is not reproduced and supported by evidence, do not guess.

## Process

### 1. Reproduce the issue

- Capture the exact failing command, input, or user flow.
- Re-run it until the failure is reproducible, or record that it is intermittent.
- If it does not reproduce yet, keep gathering data instead of proposing changes.

### 2. Gather evidence

- Read the full error output, stack trace, logs, and test failure text.
- Check recent relevant changes and the specific code path involved.
- In multi-step flows, trace the data or state across each boundary until it stops matching expectations.
- Write down the observed facts separately from assumptions.

### 3. Identify root cause

- Form one concrete hypothesis that explains the evidence.
- Test that hypothesis with the smallest possible confirming check.
- If the check fails, discard the hypothesis and continue investigating.
- Do not recommend a fix until the root cause is identified in substance.

### 4. Ask focused follow-up questions only when needed

- Ask one focused question only if a missing fact blocks reproduction or root-cause analysis.
- Prefer questions that unlock a specific check, such as environment, inputs, or expected behavior.
- Do not ask broad exploratory questions when the answer can be gathered from the repo or command output.

### 5. Then fix and verify

- Change the smallest thing that addresses the root cause.
- Re-run the reproduction step and any relevant tests.
- If the fix does not hold up under verification, return to investigation.

## Red Flags

- Proposing code changes before reproducing the issue
- Treating symptoms as the root cause
- Bundling multiple speculative fixes together
- Saying something "should work" without evidence
- Asking unfocused questions instead of collecting the next missing fact

## Arc Notes

- Keep arc issue state truthful while investigating.
- If debugging reveals separate follow-up work, capture it in arc instead of hiding it inside the current task.
- Format any arc notes per `skills/arc/_formatting.md`.

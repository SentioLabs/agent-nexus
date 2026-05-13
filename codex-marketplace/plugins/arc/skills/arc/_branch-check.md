# Protected-Branch Check

Shared reference for arc workflow skills (brainstorm, build, finish). When a skill says "perform the protected-branch check per `skills/arc/_branch-check.md`", do exactly what's in this file.

## Why this check exists

Direct commits to trunk (`main` / `master` / `release` / `production`) bypass review, are hard to undo without rewriting shared history, and are how releases get broken. The cost of one explicit branch choice is much smaller than the cost of discovering at finish time that a whole work session landed on trunk.

## When to run the check

| Skill | When |
|---|---|
| `brainstorm` | Pre-flight, before any design dialogue. Sets up the branch context for everything downstream. |
| `build` | Pre-flight, before dispatching any task. Subagents will commit to whatever branch you're on. |
| `finish` | Phase 4, immediately before staging/committing. Last line of defense. |

Run it every time the skill runs. Do not assume a previous answer carries forward across sessions.

## How to run the check

1. Get the current branch:

   ```bash
   git branch --show-current
   ```

2. If the result is not in the protected list (`main`, `master`, `release`, `production`), you're done. Proceed with the skill.

3. If the result is protected, check project instructions for an explicit opt-out. Look in `AGENTS.md` first, then `CLAUDE.md` if present, for a line like:

   ```text
   This project commits directly to main; skip the protected-branch check.
   ```

   If present, proceed without prompting. The project owner has consciously chosen trunk-based development.

4. Otherwise, ask the user to choose one path. In Codex Plan mode, use `request_user_input` if available; otherwise ask a concise plain-text question and wait:

   ```text
   You're on '<branch>'. Continue here, or switch to a feature branch first?
   ```

   Offer these choices:

   - `Switch to a feature branch` — recommended. Run `git checkout -b <suggested-name>` using a name from the work context, then proceed on the new branch.
   - `Stay on '<branch>'` — the user has consciously chosen trunk-direct work for this session.
   - `Cancel` — abort the current skill so the user can handle branching manually first.

5. Branch on the answer:

   - **Switch** -> create the branch, then continue the skill on it.
   - **Stay** -> continue on trunk.
   - **Cancel** -> stop the skill. Do not commit, dispatch tasks, or write design docs.

## Why no env-var or CLI flag opt-out

This is a skill-level prompt, not a hook. The opt-out lives in project instructions so it is discoverable, version-controlled, and applies project-wide. If the prompt is annoying for a trunk-based repo, add the opt-out line to `AGENTS.md`.

## What this check is not

- Not a substitute for branch protection rules on the remote. Those are the actual enforcement layer.
- Not a check that the target of `git push` is main; only that the current branch is.
- Not a hook. There is no harness-level enforcement. The pre-flight placement in brainstorm and build, plus the finish check, is the mitigation.

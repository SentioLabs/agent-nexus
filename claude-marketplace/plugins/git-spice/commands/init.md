---
description: Initialize git-spice in the current repo (sets trunk + remote, checks auth)
argument-hint: [trunk-name | --trunk=<name> --remote=<name>]
---

Initialize git-spice for this repository.

1. Confirm you're inside a git repository: run `git rev-parse --show-toplevel`. If it fails, stop and tell the user this isn't a git repo.
2. Check whether git-spice is already initialized: `git-spice log long 2>&1`. If it succeeds and shows a trunk, tell the user it's already initialized and offer to re-init with `git-spice repo init --reset` only if they ask.
3. Run `git-spice repo init`. If `$ARGUMENTS` was provided, treat it as either a trunk branch name or `--trunk=<name> --remote=<name>` flags and pass it through. Otherwise let the interactive prompt run.
4. After init, run `git-spice auth status` and report whether the user is logged in. If not, suggest `git-spice auth login` — do NOT run it yourself (it's an interactive browser flow).
5. Show the result of `git-spice log long` so the user sees the starting state.

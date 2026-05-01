---
description: Stack a new branch on top of the current branch from staged changes
argument-hint: <branch-name>
---

Create a new branch on top of the current one with `git-spice branch create`.

1. Parse `$ARGUMENTS` as the branch name. If empty, ask the user for one (or note that git-spice will auto-generate from the commit message if `--no-commit` isn't used).
2. Check `git status --porcelain`. Decide:
   - **Staged changes present** → run `git-spice branch create <name>`. It commits the staged changes onto the new branch.
   - **Only unstaged changes** → ask the user: stage them all (`-a` flag) or stop so they can stage selectively? Don't decide silently.
   - **Working tree clean** → run `git-spice branch create <name> --no-commit` (creates an empty branch ready for work) and tell the user it's empty.
3. If the user wants the new branch *between* current and its upstack (insertion), pass `--insert`. If they want it *below* current, pass `--below`. Only do this if the user signals it explicitly.
4. After creating, run `git-spice log long` and show the new shape.

Don't run `git commit` directly — `git-spice branch create` handles the commit *and* records the base relationship. A raw commit would split the two steps and leave the stack metadata out of sync.

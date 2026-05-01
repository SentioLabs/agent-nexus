---
name: git-spice
description: Reference for the git-spice CLI — stacked-branch workflows, command map, and recovery from interrupted rebases. Use whenever the user mentions git-spice, `gs`, stacked PRs, stacked diffs, branch stacks, dependent branches, PRs that depend on each other, or says things like "stack this", "check the stack", "submit the stack", "submit my stacked PRs", "restack", "rebase failed", "sync after merge", "what's on top of <branch>", "branch above/below". Also load when a multi-step plan would naturally produce a chain of dependent branches and you need to drive that with the CLI, or when an interrupted rebase needs recovery.
---

# git-spice

git-spice is a CLI for managing **stacks of dependent Git branches**. Each branch (except the trunk) has a recorded *base* — the branch it was created from. git-spice tracks those relationships, restacks (rebases) dependents automatically when a base changes, and submits the whole chain as separate-but-linked Change Requests (PRs/MRs).

Use this skill whenever you need to translate user intent ("stack this", "submit the stack", "rebase everything", "what's on top of feat-1?") into the right CLI invocations.

## Binary name

The official shorthand is `gs`, but on many systems `gs` is **Ghostscript**. **Always invoke `git-spice` directly** in scripts, commands, and tool calls — never assume `gs` is git-spice. (If a user types `gs` in chat, mentally map it to `git-spice`.)

The subcommand abbreviations shown in parentheses below — `r i`, `b c`, `ls`, `ll`, `bc`, etc. — work natively under `git-spice` itself (e.g. `git-spice ls` runs `log short`). They're not a `gs`-only thing. Use the full forms in scripts you check in; abbreviations are fine for one-off commands.

## Mental model

```
        ┌── feat-c       ← upstack of feat-b
      ┌─┴ feat-b         ← upstack of feat-a, downstack of feat-c
    ┌─┴ feat-a           ← stacked on trunk
    main (trunk)
```

- **trunk** — the repo's default branch (usually `main`/`master`). The only branch without a base.
- **base** — the branch a given branch was created from. Stored as metadata by git-spice.
- **upstack** — every branch transitively above this one.
- **downstack** — every branch between this one and trunk (exclusive of trunk).
- **restack** — rebase a branch (or set of branches) onto its current base. Run after the base moves.

git-spice operations are *local-first*. Auth is only needed for `submit`/`sync` (network operations).

## Command map

Sorted by intent, not alphabet — find the verb you mean, copy the command. Long forms shown; both built-in shorthands and one-letter aliases are listed.

### Setup

| Intent | Command |
|---|---|
| Initialize git-spice in this repo | `git-spice repo init` (`git-spice r i`) |
| Re-init / change trunk or remote | `git-spice repo init --trunk=<b> --remote=<r>` |
| Reset all tracking, keep branches | `git-spice repo init --reset` |
| Log in to GitHub/GitLab/Bitbucket | `git-spice auth login` |
| Check who you're logged in as | `git-spice auth status` |
| Log out | `git-spice auth logout` |

### Inspect

| Intent | Command |
|---|---|
| Show the current stack | `git-spice log short` (`git-spice ls`) |
| Show stack with commit details | `git-spice log long` (`git-spice ll`) |
| Diff this branch vs its base | `git-spice branch diff` (`git-spice bdi`) |

### Create / extend a stack

| Intent | Command |
|---|---|
| Stack a new branch on top of HEAD with staged changes | `git-spice branch create <name>` (`git-spice bc`) |
| Same, but auto-stage tracked-but-modified files (like `git commit -a`) | `git-spice branch create <name> -a` |
| Same, with an explicit commit message | `git-spice branch create <name> -m "subject"` |
| Create branch without committing | `git-spice branch create <name> --no-commit` |
| Insert a branch *between* current and its upstack | `git-spice branch create <name> --insert` |
| Create branch *below* current (push current upstack) | `git-spice branch create <name> --below` |
| Track an existing git branch | `git-spice branch track` (`git-spice btr`) |
| Track every untracked branch below current | `git-spice downstack track` (`git-spice dstr`) |

### Commit on the current branch (auto-restacks upstack)

| Intent | Command |
|---|---|
| Commit staged changes here | `git-spice commit create` (`git-spice cc`) |
| Amend the tip commit | `git-spice commit amend` (`git-spice ca`) |
| Split a commit interactively | `git-spice commit split` (`git-spice csp`) |
| Apply staged changes as fixup to commit X | `git-spice commit fixup <ref>` (`git-spice cf`) |

> Prefer `git-spice commit ...` over raw `git commit` while inside a stack. The git-spice variants restack everything above the current branch automatically; `git commit` leaves upstack branches misaligned and you'll have to run `git-spice upstack restack` yourself.

### Navigate

| Intent | Command |
|---|---|
| Up one branch (prompts on fork) | `git-spice up` |
| Down one branch | `git-spice down` |
| Top of stack | `git-spice top` |
| Bottom of stack | `git-spice bottom` |
| Trunk | `git-spice trunk` |
| Pick a branch interactively | `git-spice branch checkout` (`git-spice bco`) |

### Reshape

| Intent | Command |
|---|---|
| Restack just this branch onto its base | `git-spice branch restack` (`git-spice br`) |
| Restack this branch + everything above | `git-spice upstack restack` (`git-spice usr`) |
| Restack the whole stack | `git-spice stack restack` (`git-spice sr`) |
| Restack every tracked branch in the repo | `git-spice repo restack` (`git-spice rr`) |
| Squash this branch's commits into one | `git-spice branch squash` (`git-spice bsq`) |
| Split this branch at chosen commits | `git-spice branch split` (`git-spice bsp`) |
| Fold (merge) this branch into its base | `git-spice branch fold` (`git-spice bfo`) |
| Move this branch onto a new base, leave upstack alone | `git-spice branch onto <base>` (`git-spice bon`) |
| Move this branch + upstack onto a new base | `git-spice upstack onto <base>` (`git-spice uso`) |
| Reorder branches in the stack | `git-spice stack edit` (`git-spice se`) |
| Rename | `git-spice branch rename <new>` (`git-spice brn`) |
| Delete branch (auto-restacks upstack onto its base) | `git-spice branch delete <name>` (`git-spice bd`) |
| Untrack only (keep the git branch) | `git-spice branch untrack <name>` (`git-spice buntr`) |

### Submit (push + open/update PRs)

All submit commands are **idempotent**: re-running on an existing stack updates PRs in place.

| Intent | Command |
|---|---|
| Submit just this branch | `git-spice branch submit` (`git-spice bs`) |
| Submit this branch and below | `git-spice downstack submit` (`git-spice dss`) |
| Submit this branch and above | `git-spice upstack submit` (`git-spice uss`) |
| Submit the whole stack | `git-spice stack submit` (`git-spice ss`) |

Common flags on submit:
- `--fill` / `-c` — populate title + body from commit messages (skip the prompt). Use this for non-interactive runs.
- `--dry-run` / `-n` — preview what would be submitted.
- `--draft` / `--no-draft` — set draft state.
- `--update-only` — only update branches that already have CRs; skip new ones.
- `--no-publish` — push branches without opening CRs.
- `--web` / `-w` — open the resulting CRs in a browser.
- `--nav-comment=false|true|multiple` — control the auto-generated stack-navigation comment.
- `--force` — escalate from the default `--force-with-lease` to a hard force-push. Use only when the lease check is rejecting a push you've confirmed is safe. The default already handles the normal force-push case.

### Sync with remote

| Intent | Command |
|---|---|
| Pull trunk + delete merged branches | `git-spice repo sync` (`git-spice rs`) |

`repo sync` is the canonical "after my PR merged, clean up" command. It pulls trunk, finds branches whose CRs were merged, deletes them, and restacks anything that was on top.

### Recover from an interrupted rebase

git-spice rebases run `git rebase` under the hood. Conflicts pause the operation. **Resolve with the git-spice variants, not raw git:**

| Intent | Command |
|---|---|
| Continue after resolving conflicts | `git-spice rebase continue` (`git-spice rbc`) |
| Abort and restore pre-rebase state | `git-spice rebase abort` (`git-spice rba`) |

Workflow during a conflict:
1. Edit conflicted files, `git add` them.
2. Run `git-spice rebase continue`. git-spice resumes its multi-branch operation (e.g., a stack restack continues onto the next branch).

Using raw `git rebase --continue` works for the *current* rebase only; git-spice won't auto-advance to the next branch in a multi-step operation.

## Common workflows

### Build a stack from staged changes

```bash
# On trunk, with the first chunk staged
git-spice branch create feat-a
# Stage the next chunk
git-spice branch create feat-b
# And so on
git-spice branch create feat-c
git-spice log long   # confirm the shape
```

### Update a mid-stack branch

```bash
git-spice down                  # drop down to feat-b
# edit files, git add
git-spice commit amend          # or commit create — both auto-restack upstack
```

### Submit and iterate

```bash
git-spice stack submit --fill   # push all, open PRs, fill from commit messages
# Reviewer leaves feedback on feat-b
git-spice branch checkout feat-b
# fix, git add
git-spice commit amend
git-spice stack submit --fill   # idempotent — only changed branches force-push
```

### Sync after a merge

```bash
git-spice trunk
git-spice repo sync             # pulls main, deletes merged branches, restacks survivors
```

### Insert a new branch into an existing stack

```bash
git-spice branch checkout feat-b
git-spice branch create --insert feat-b2   # feat-b2 sits between feat-b and feat-c
```

### Move a sub-stack onto a different base

```bash
git-spice branch checkout feat-b
git-spice upstack onto main     # detach feat-b + everything above; rebase onto main
```

## Recovery / triage

Stacks get into wedged states. Common ones:

- **Restack stopped on conflict** → `git add` resolutions, `git-spice rebase continue`. If you want out, `git-spice rebase abort`.
- **Branch silently diverged from base** → `git-spice branch restack` for one, `git-spice repo restack` for all.
- **Branches not tracked** (git branches that exist but git-spice doesn't know about) → `git-spice branch track` on each, or `git-spice downstack track` from the top.
- **Wrong trunk recorded** → `git-spice repo init --trunk=<correct>`.
- **Want to start over** → `git-spice repo init --reset` (forgets tracking, leaves git branches intact).

For non-trivial recovery (multiple wedged branches, lost work, divergence after a force-push from someone else), dispatch the **stack-doctor** subagent — it has a structured triage protocol.

## Building a stack programmatically (driving from a plan)

When you need to translate a sequence of dependent tasks into a stack:

1. Confirm the repo is initialized: `git-spice auth status` (network ops will need it) and that trunk is set (`git-spice log long` — should show the trunk root).
2. Start on trunk: `git-spice trunk`.
3. For each task: implement → `git add` → `git-spice branch create <slug>` (this commits + creates + tracks in one step).
4. After the last task: `git-spice stack submit --fill` to open the chain of PRs.

The **stacker** subagent encapsulates this loop and is what you should dispatch when handed a multi-step plan that should ship as a stack.

## Don't

- **Don't `git rebase` inside a stack** without going through git-spice. You'll desync the recorded bases. Use `git-spice branch edit` / `git-spice upstack restack` instead.
- **Don't `git push --force`** on a tracked branch. Use `git-spice <scope> submit` — git-spice uses `--force-with-lease` semantics and updates only the branches that need it.
- **Don't delete tracked branches with `git branch -D`.** Use `git-spice branch delete` so upstack branches get re-parented.
- **Don't assume `gs`** is git-spice in commands you write. Always `git-spice`.

## Dispatching the subagents

`stacker` and `stack-doctor` are subagents in this plugin. Dispatch them via the Task tool with `subagent_type: stacker` or `subagent_type: stack-doctor`. Pass the inputs each agent's prompt expects (the dispatching prompt is what gives them context — they have no prior conversation).

## Configuration

Per-repo config lives in `git config` under the `spice.*` namespace:

- `spice.submit.draft=true` — open new CRs as drafts by default.
- `spice.submit.navigationComment=false` — don't post the stack-navigation comment.
- `spice.submit.label=stack` — auto-label new CRs.
- `spice.submit.reviewers=alice,bob` — auto-request reviewers.
- `spice.branchCreate.prefix=user/` — prefix all new branches.

Set with `git config spice.submit.draft true` (add `--global` for user-wide).

# arc + git-spice — Stacked-PR Workflow

How to use the [`arc`](./skills/arc/SKILL.md) plugin and the
[`git-spice`](../git-spice/skills/git-spice/SKILL.md) plugin together when an
arc epic should ship as a chain of dependent PRs instead of one big PR.

This is a playbook, not a new skill. Both plugins keep their own behavior — this
doc just describes the integration points and the order of operations. Read the
two source skills (`arc/skills/arc/SKILL.md`, `git-spice/skills/stacking-workflow/SKILL.md`)
for the underlying mental models.

## When to stack an arc epic

The decision is about *the shape of the work*, not about either tool. Stack
when **all** of the following hold:

- The epic decomposes into 3+ tasks with **linear dependencies** (T0 → T1 → T2 …),
  not independent tasks that could run in parallel.
- Each task is independently reviewable — a reviewer would thank you for the
  split (the smell test from the `stacking-workflow` skill).
- The team's review culture rewards small PRs over one big PR.

**Don't stack** when:

- Tasks are independent and have no shared files — use arc's
  [Parallel Dispatch Protocol](./skills/build/SKILL.md#parallel-dispatch-protocol)
  with worktrees. Stacking dependent tasks and parallelizing independent tasks
  are different problem shapes; don't conflate them.
- The epic is one task, or a handful of tasks that share files heavily — one PR
  is fine.
- The work is exploratory and middle pieces may get discarded.

| arc epic shape | Recommended dispatch |
|---|---|
| Single task | normal `arc:build` flow, one PR |
| 2-3 tasks with shared files | normal `arc:build` flow, one PR |
| 3+ independent tasks (no file overlap, no deps) | `arc:build` parallel dispatch with worktrees, one PR |
| 3+ tasks with linear deps, each independently reviewable | **stack** (this doc) |
| Refactor-then-feature, scaffold-then-implement | **stack** (this doc) |

## Concept mapping

| arc | git-spice | Notes |
|---|---|---|
| epic | stack | One stack per arc epic |
| T0 foundation task | bottom branch (on trunk) | Shared types, contract assertions land first |
| T1, T2, … (dep order) | upstack branches | Each task gets one branch |
| `arc update <task> --take` | `git-spice branch create <slug> --no-commit` (before builder dispatch) | Seed the empty branch first; builder's commit lands on it |
| `builder` dispatch | the commit on that branch | TDD discipline unchanged |
| spec-review + code-review gates | run against `PRE_TASK_SHA..HEAD` on the new branch | arc's gates apply per-branch |
| `arc close <task>` | branch is sealed; move to next | Close after gates pass; don't wait for PR merge |
| (no equivalent in arc) | `git-spice stack submit --fill` | Open the PR chain after the last task closes |
| `arc:finish` | `git-spice repo sync` after merges | finish stops at the stack-submit boundary |
| design doc in `docs/plans/` | stays on trunk | The marker contract is unaffected by stacking |

## End-to-end flow

### 0. One-time per repo

```bash
git-spice repo init                  # if not already initialized
git-spice auth status                # confirm logged into the forge
```

### 1. Brainstorm + plan (unchanged)

```
/arc:brainstorm                      # produces docs/plans/<file>.md with the marker
/arc:plan                            # creates epic + tasks with dependencies
```

The plan skill establishes the dependency graph (`blocks` / `blockedBy`). For a
stack, that graph **must be linear**: T0 blocks T1, T1 blocks T2, etc. If the
graph forks, either it's not a stack (use parallel dispatch) or you need to
linearize the plan first.

### 2. Decide to stack

Run the smell test from the table above. If yes, confirm with the user:

> "This epic has N tasks with linear deps. Want to ship as a stack of N PRs (one
> per task) or as a single PR? Stacking gives reviewers smaller diffs but is
> more ceremony — see arc/STACKING.md."

### 3. Build the stack — task by task

Start on trunk:

```bash
git-spice trunk
git status --porcelain               # must be clean
```

For each task in dependency order (T0 → T1 → …):

```bash
TASK=<task-id>
SLUG=<short-kebab-name>              # e.g. "t1-types", "t2-middleware"
PRE_TASK_SHA=$(git rev-parse HEAD)

arc update $TASK --take

# Seed an empty branch FIRST so the builder's commit lands on it.
git-spice branch create $SLUG --no-commit

# Dispatch the builder per the normal arc:build flow.
# Use the model-selection guidance and prompt template from skills/build/SKILL.md.
# The builder implements + commits on the new branch.
#   ↳ run spec-reviewer, code-reviewer, evaluator (if applicable) per the
#     orchestration loop — they all operate on PRE_TASK_SHA..HEAD on this branch.

arc close $TASK -r "Implemented: <summary>"

# Move to the next task — the new HEAD becomes the base for the next branch.
```

**Why `--no-commit` before the builder, not after?** The builder commits inline
as part of its TDD loop. If you create the branch *after* the commit, the commit
lives on the previous branch and you'd need `git reset --soft` and a manual
re-commit on the new branch to fix it. Seeding the empty branch first keeps the
commit on the right branch automatically.

**Iteration during gates.** If spec-review or code-review demands a fix, the
builder re-dispatches and produces another commit — but you want it as an
*amendment*, not a stacked commit on top of the same branch. Run
`git-spice commit amend` (or instruct the builder to). git-spice auto-restacks
upstack branches; in this flow there are none yet, so amend is safe.

### 4. Submit the stack

After the **last** task closes:

```bash
git-spice log long                   # sanity-check the stack shape
git-spice stack submit --fill        # push all branches, open the PR chain
```

`--fill` populates each PR's title + body from the commit message. If your
builder commits use Conventional Commits (the arc plan skill generates them),
the resulting PR titles will be readable as-is.

### 5. Review iteration — per branch

Reviewer comments land on individual PRs. For each:

```bash
git-spice branch checkout <branch-with-comments>
# fix the issues — re-dispatch the builder if substantive,
# or edit by hand if it's a one-line nit per arc:review's triage
git add <files>
git-spice commit amend
git-spice stack submit --fill        # idempotent — only the changed branch + upstack force-push
```

The auto-restack of upstack branches happens during `commit amend`. If a
restack hits a conflict, resolve and `git-spice rebase continue` — never
`git rebase --continue` directly.

### 6. Land bottom-up

Branches at the bottom merge first. After each merge:

```bash
git-spice trunk
git-spice repo sync                  # pulls trunk, deletes the merged branch, restacks survivors
```

Run `repo sync` after **every** merge. The remaining stack continues to
function — its base just shifts to the (new) trunk.

### 7. Closing the loop

When the last branch merges and `repo sync` reports a clean trunk:

- The arc epic should already be closed (you closed each task in step 3).
- Run `arc prime` for next-session context if you're done for the day.
- Skip `arc:finish` — its commit/push phase doesn't apply when each task already
  shipped on its own branch. Its issue-update + worktree-cleanup phases (Phase 3
  + Phase 4 step 16) are still useful if you ran any tasks in arc parallel
  mode and accumulated worktrees.

## Subagent dispatch — picking the right one

The plugins ship overlapping subagents. They're not interchangeable.

| If you're … | Dispatch |
|---|---|
| Implementing one arc task end-to-end (TDD + tests) | `arc:builder` (per arc:build's loop) |
| Building a stack of N branches in one uninterrupted pass with no per-task review gates | `git-spice:stacker` |
| Stacking arc tasks AND keeping arc's review gates per task | **No subagent — the orchestrator runs the loop in step 3 above.** Don't dispatch `stacker`; it doesn't know about arc's spec-review / code-review / evaluator gates. |
| Recovering a wedged stack (rebase failed, branches diverged) | `git-spice:stack-doctor` |
| Auditing an arc spec / code review | `arc:spec-reviewer`, `arc:code-reviewer`, `arc:evaluator` (unchanged) |

**The rule of thumb**: `stacker` is the right call when arc isn't in play — a
plain "build me a stack from this list" task. Once arc tasks with review gates
are involved, the orchestrator drives the loop and dispatches arc subagents
per-branch, treating git-spice as plumbing.

## Failure modes specific to this combination

- **"The builder committed before I made the branch."** You forgot
  `git-spice branch create <slug> --no-commit` before the dispatch. Recover with
  `git reset --soft HEAD~1`, then `git-spice branch create <slug>` (the staged
  files become the commit on the new branch). Don't re-dispatch the builder —
  the work is already done.
- **"Two arc tasks ended up on the same branch."** Same root cause — missed the
  `--no-commit` seed for the second task. Use `git-spice branch split` to cut
  the branch at the boundary commit.
- **"arc says T2 is blocked by T1, but I'm building T2 on a branch that doesn't
  include T1."** The branch base is wrong. `git-spice branch checkout T2-branch`
  then `git-spice upstack onto <T1-branch>` to re-parent.
- **"Reviewer asked me to drop T1 entirely."** `git-spice branch delete <T1-branch>`
  auto-restacks T2+ onto trunk. Then `arc update <T1-id> --status closed` (or
  delete the task) so the issue tracker matches reality.
- **"`stack submit` opened too many PRs."** You probably ran it before closing
  out the dependency graph; the unblocked tasks all submitted at once. Either
  let it ride (the chain is still correct) or use `--update-only` next time
  combined with per-branch `branch submit` to control the surface area.

For wedged-stack recovery beyond the above, dispatch `git-spice:stack-doctor`.

## What this doc deliberately doesn't do

- **Modify any arc skill** to be git-spice-aware. The integration is manual and
  documented, not automated. If usage justifies it, a future `/arc:stack-build`
  command could collapse step 3's loop, but we don't have that data yet.
- **Modify any git-spice skill** to be arc-aware. Same reasoning.
- **Cover non-stacked arc workflows.** For those, follow the normal
  brainstorm → plan → build → review → finish pipeline; nothing here applies.
- **Cover non-arc git-spice usage.** For those, see the
  `git-spice/skills/stacking-workflow/SKILL.md` smell test and end-to-end flow.

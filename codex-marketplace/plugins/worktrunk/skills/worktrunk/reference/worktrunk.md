# Worktrunk

Worktrunk is a CLI for git worktree management, designed for running AI agents
in parallel.

Worktrunk's three core commands make worktrees as easy as branches.
Plus, Worktrunk has a bunch of quality-of-life features to simplify working
with many parallel changes, including hooks to automate local workflows.

Scaling agents becomes trivial. A quick demo:

## Context: git worktrees

AI agents like Claude Code and Codex can handle longer tasks without
supervision, such that it's possible to manage 5-10+ in parallel. Git's native
worktree feature give each agent its own working directory, so they don't step
on each other's changes.

But the git worktree UX is clunky. Even a task as small as starting a new
worktree requires typing the branch name and worktree path multiple times: `git
worktree add -b feat <worktree-path>`, then `cd <worktree-path>`.

## Worktrunk makes git worktrees as easy as branches

Worktrees are addressed by branch name; paths are computed from a configurable template.

> Start with the core commands

**Core commands:**

| Task | Worktrunk | Plain git |
| --- | --- | --- |
| Switch worktrees | `wt switch feat` | `cd <worktree-path>` |
| Create a worktree | `wt switch -c feat` | `git worktree add -b feat <worktree-path> && cd <worktree-path>` |
| Clean up | `wt remove` | `cd <repo> && git worktree remove <worktree-path> && git branch -d feat` |
| List with status | `wt list` | `git worktree list (paths only)` |

> Expand into the more advanced commands as needed

**Workflow automation:**

- **[Hooks](https://worktrunk.dev/hook/)** — run commands on create, pre-merge, post-merge, etc
- **[LLM commit messages](https://worktrunk.dev/llm-commits/)** — generate commit messages from diffs
- **[Merge workflow](https://worktrunk.dev/merge/)** — squash, rebase, merge, clean up in one command
- **[Interactive picker](https://worktrunk.dev/switch/#interactive-picker)** — browse worktrees with live diff and log previews
- **[Copy build caches](https://worktrunk.dev/step/)** — skip cold starts by sharing `target/`, `node_modules/`, etc between worktrees
- **[`wt list --full`](https://worktrunk.dev/list/#full-mode)** — [CI status](https://worktrunk.dev/list/#ci-status) and [AI-generated summaries](https://worktrunk.dev/list/#llm-summaries) per branch
- **[PR checkout](https://worktrunk.dev/switch/#pull-requests-and-merge-requests)** — `wt switch pr:123` to jump straight to a PR's branch
- **[Dev server per worktree](https://worktrunk.dev/hook/#dev-servers)** — `hash_port` template filter gives each worktree a unique port
- ...and **[lots more](#next-steps)**

A demo with some advanced features:

## Install

**Homebrew (macOS & Linux):**

```bash
$ brew install worktrunk && wt config shell install
```

Shell integration allows commands to change directories.

**Cargo:**

```bash
$ cargo install worktrunk && wt config shell install
```

### Windows

On Windows, `wt` defaults to Windows Terminal's command. Winget additionally installs Worktrunk as `git-wt` to avoid the conflict:

```bash
$ winget install max-sixty.worktrunk
$ git-wt config shell install
```

Alternatively, disable Windows Terminal's alias (Settings → Privacy & security → For developers → App Execution Aliases → disable "Windows Terminal") to use `wt` directly.

**Arch Linux:**

```bash
$ sudo pacman -S worktrunk && wt config shell install
```

## Quick start

Create a worktree for a new feature:

```bash
$ wt switch --create feature-auth
✓ Created branch feature-auth from main and worktree @ repo.feature-auth
```

This creates a new branch and worktree, then switches to it. Do your work, then check all worktrees with [`wt list`](https://worktrunk.dev/list/):

```bash
$ wt list
Branch        Status  HEAD±   main↕  Remote⇅  Commit    Age   Message
feature-auth  + ↑    +27    -8    ↑1             4bc72dc9  2h    Add authentication module
main          ^⇡            ⇡1      0e631add  1d    Initial commit

Showing 2 worktrees, 1 with changes, 1 ahead, 1 column hidden
```

The `@` marks the current worktree. `+` means staged changes, `↑1` means 1 commit ahead of main, `⇡` means unpushed commits.

When done, either:

**PR workflow** — commit, push, open a PR, merge via GitHub/GitLab, then clean up:

```bash
$ wt step commit                    # commit staged changes
$ gh pr create                      # or glab mr create
$ wt remove                         # after PR is merged
```

**Local merge** — squash, rebase onto main, fast-forward merge, clean up:

```bash
$ wt merge main
◎ Generating commit message and committing changes... (2 files, +53), no squashing needed
Add authentication module
✓ Committed changes @ a1b2c3d
◎ Merging 1 commit to main @ a1b2c3d (no rebase needed)
* a1b2c3d Add authentication module
  auth.rs | 51 +++++++++++++++++++++++++++++++++++++++++++++++++++
  lib.rs  |  2 ++
  2 files changed, 53 insertions(+)
✓ Merged to main (1 commit, 2 files, +53)
◎ Removing feature-auth worktree & branch in background (same commit as main, _)
○ Switched to worktree for main @ repo
```

For parallel agents, create multiple worktrees and then launch Codex in each one:

```bash
$ wt switch --create feature-a
$ codex

$ wt switch --create feature-b
$ codex

$ wt switch --create feature-c
$ codex
```

Use [post-start hooks](https://worktrunk.dev/hook/) to automate setup (install deps, start dev servers). If you later validate a local `-x codex` wrapper for your environment, document it in your own shell config before relying on prompt passthrough.

## Next steps

- Learn the core commands: [`wt switch`](https://worktrunk.dev/switch/), [`wt list`](https://worktrunk.dev/list/), [`wt merge`](https://worktrunk.dev/merge/), [`wt remove`](https://worktrunk.dev/remove/)
- Set up [project hooks](https://worktrunk.dev/hook/) for automated setup
- Explore [LLM commit messages](https://worktrunk.dev/llm-commits/), [interactive
  picker](https://worktrunk.dev/switch/#interactive-picker), Codex integration in `reference/codex.md`, [CI
  status & PR links](https://worktrunk.dev/list/#ci-status)
- Browse [tips & patterns](https://worktrunk.dev/tips-patterns/) for recipes: aliases, dev servers, databases, agent handoffs, and more
- Run `wt --help` or `wt <command> --help` for quick CLI reference

## Further reading

- [OpenAI Codex CLI docs](https://developers.openai.com/codex/cli/) — official non-interactive and interactive Codex usage
- [@DevOpsToolbox's video on Worktrunk](https://youtu.be/WBQiqr6LevQ?t=345)
- [git-worktree documentation](https://git-scm.com/docs/git-worktree) — Official git reference

# Tips & Patterns

Practical recipes for common Worktrunk workflows.

## Alias for new worktree + agent

Create the worktree and launch Codex without assuming any particular worktree-path template:

```bash
$ alias wsc='wt switch --create'
$ wsc new-feature
$ codex
```

This port does not assume a validated `-x codex -- '<task>'` prompt-passthrough pattern. If you establish one locally, keep it in your own shell config rather than treating it as a documented default here.

## Eliminate cold starts

Use [`wt step copy-ignored`](https://worktrunk.dev/step/#wt-step-copy-ignored) to copy gitignored files (caches, dependencies, `.env`) between worktrees:

```toml
[post-start]
copy = "wt step copy-ignored"
```

Use `pre-start` instead if subsequent hooks or `--execute` command need the copied files immediately.

All gitignored files are copied by default. To limit what gets copied, create `.worktreeinclude` with patterns — files must be both gitignored and listed. See [`wt step copy-ignored`](https://worktrunk.dev/step/#wt-step-copy-ignored) for details.

## Dev server per worktree

Each worktree runs its own dev server on a deterministic port. The `hash_port` filter generates a stable port (10000-19999) from the branch name:

```toml
# .config/wt.toml
[post-start]
server = "npm run dev -- --port {{ branch | hash_port }}"

[list]
url = "http://localhost:{{ branch | hash_port }}"

[pre-remove]
server = "lsof -ti :{{ branch | hash_port }} -sTCP:LISTEN | xargs kill 2>/dev/null || true"
```

The URL column in `wt list` shows each worktree's dev server:

```text
Branch       Status  HEAD±   main↕  Remote⇅  URL                     Commit    Age
main         ? ^⇅            ⇡1     ⇣1       http://localhost:12107  41ee0834  4d
feature-api  + ↕⇡   +54    -5    ↑4    ↓1  ⇡3  http://localhost:10703  6814f02a  30m
fix-auth     ↕|            ↑2    ↓1    |       http://localhost:16460  b772e68b  5h
fix-typos    _|                     |      http://localhost:14301  41ee0834  4d

Showing 4 worktrees, 2 with changes, 2 ahead, 2 columns hidden
```

Ports are deterministic — `fix-auth` always gets port 16460, regardless of which machine or when. The URL dims if the server isn't running.

## Database per worktree

Each worktree can have its own isolated database. A pipeline sets up names and ports as vars, then later steps and hooks reference them:

```toml
post-start = [
  """
  wt config state vars set \
    container='{{ repo }}-{{ branch | sanitize }}-postgres' \
    port='{{ ('db-' ~ branch) | hash_port }}' \
    db_url='postgres://postgres:dev@localhost:{{ ('db-' ~ branch) | hash_port }}/{{ branch | sanitize_db }}'
  """,
  { db = """
  docker run -d --rm \
    --name {{ vars.container }} \
    -p {{ vars.port }}:5432 \
    -e POSTGRES_DB={{ branch | sanitize_db }} \
    -e POSTGRES_PASSWORD=dev \
    postgres:16
  """},
]

[pre-remove]
db-stop = "docker stop {{ vars.container }} 2>/dev/null || true"
```

The first pipeline step derives values from the branch and stores them as vars. The second step references `{{ vars.container }}` and `{{ vars.port }}` — expanded at execution time, after the vars are set. `pre-remove` uses the same vars to stop the container before the worktree is deleted.

The `('db-' ~ branch)` concatenation hashes differently than plain `branch`, so database and dev server ports don't collide. The `sanitize_db` filter produces database-safe identifiers (lowercase, underscores, no leading digits, with a short hash suffix).

The connection string is accessible anywhere — not just in hooks:

```bash
$ DATABASE_URL=$(wt config state vars get db_url) npm start
```

## Local CI gate

`pre-merge` hooks run before merging. Failures abort the merge:

```toml
[pre-merge]
"lint" = "uv run ruff check"
"test" = "uv run pytest"
```

This catches issues locally before pushing — like running CI locally.

## Manual commit messages

The `commit.generation.command` receives the rendered prompt on stdin and returns the commit message on stdout. To write commit messages by hand instead of using an LLM, point it at `$EDITOR`:

```toml
# ~/.config/worktrunk/config.toml
[commit.generation]
command = '''f=$(mktemp); printf '\n\n' > "$f"; sed 's/^/# /' >> "$f"; ${EDITOR:-vi} "$f" < /dev/tty > /dev/tty; grep -v '^#' "$f"'''
```

This comments out the rendered prompt (diff, branch name, stats) with `#` prefixes, opens your editor, and strips comment lines on save. A couple of blank lines at the top give you space to type; the prompt context is visible below for reference.

To keep the LLM as default but use the editor for a specific merge, add a [worktrunk alias](https://worktrunk.dev/step/#aliases):

```toml
# ~/.config/worktrunk/config.toml
[aliases]
mc = '''WORKTRUNK_COMMIT__GENERATION__COMMAND='f=$(mktemp); printf "\n\n" > "$f"; sed "s/^/# /" >> "$f"; ${EDITOR:-vi} "$f" < /dev/tty > /dev/tty; grep -v "^#" "$f"' wt merge'''
```

Then `wt step mc` opens an editor for the commit message while plain `wt merge` continues to use the LLM.

## Track agent status

Custom emoji markers show agent state in `wt list`. This Codex port ships a candidate/default hook configuration, but local validation has not yet confirmed plugin-bundled hook loading in this install flow, so automatic tracking is still unconfirmed:

```text
+ feature-api      ↑  🤖              ↑1      ./repo.feature-api
+ review-ui      ? ↑  💬              ↑1      ./repo.review-ui
```

- `🤖` — Codex is working
- `💬` — Codex is waiting for input

Set status manually for any workflow:

```bash
$ wt config state marker set "🚧"                   # Current branch
$ wt config state marker set "✅" --branch feature  # Specific branch
$ git config worktrunk.state.feature.marker '{"marker":"💬","set_at":0}'  # Direct
```

See `reference/codex.md` for installation notes, hook caveats, and manual marker commands.

## Monitor CI across branches

```bash
$ wt list --full --branches
```

Shows PR/CI status for all branches, including those without worktrees. CI indicators are clickable links to the PR page.

## LLM branch summaries

With `summary = true` and [`commit.generation`](https://worktrunk.dev/config/#commit) configured, `wt list --full` shows an LLM-generated one-line summary for each branch. The same summaries appear in the `wt switch` picker (tab 5).

```toml
# ~/.config/worktrunk/config.toml
[list]
summary = true
```

Summaries are cached and regenerated only when the diff changes. See [LLM Commits](https://worktrunk.dev/llm-commits/#branch-summaries) for details.

## JSON API

```bash
$ wt list --format=json
```

Structured output for dashboards, statuslines, and scripts. See [`wt list`](https://worktrunk.dev/list/) for query examples.

## Reuse `default-branch`

Worktrunk maintains useful state. Default branch [detection](https://worktrunk.dev/config/#wt-config-state-default-branch), for instance, means scripts work on any repo — no need to hardcode `main` or `master`:

```bash
$ git rebase $(wt config state default-branch)
```

## Task runners in hooks

Reference Taskfile/Justfile/Makefile in hooks:

```toml
[pre-start]
"setup" = "task install"

[pre-merge]
"validate" = "just test lint"
```

## Shortcuts

Special arguments work across all commands—see [`wt switch`](https://worktrunk.dev/switch/#shortcuts) for the full list.

```bash
$ wt switch --create hotfix --base=@       # Branch from current HEAD
$ wt switch -                              # Switch to previous worktree
$ wt remove @                              # Remove current worktree
```

## Stacked branches

Branch from current HEAD instead of the default branch:

```bash
$ wt switch --create feature-part2 --base=@
```

Creates a worktree that builds on the current branch's changes.

## Agent handoffs

Spawn a worktree and launch Codex in the background:

**tmux** (new detached session):
```bash
tmux new-session -d -s fix-auth-bug "wt switch --create fix-auth-bug --execute codex"
```

**Zellij** (new pane in current session):
```bash
zellij run -- sh -lc "wt switch --create fix-auth-bug --execute codex"
```

This lets one Codex session hand off work to another that runs in the background. Hooks run inside the multiplexer session or pane. If you want to pass a task description automatically, validate that wrapper locally before depending on it.

## Tmux session per worktree

Each worktree gets its own tmux session with a multi-pane layout. Sessions are named after the branch for easy identification.

```toml
# .config/wt.toml
[pre-start]
tmux = """
S={{ branch | sanitize }}
W={{ worktree_path }}
tmux new-session -d -s "$S" -c "$W" -n dev

# Create 4-pane layout: shell | backend / codex | frontend
tmux split-window -h -t "$S:dev" -c "$W"
tmux split-window -v -t "$S:dev.0" -c "$W"
tmux split-window -v -t "$S:dev.2" -c "$W"

# Start services in each pane
tmux send-keys -t "$S:dev.1" 'npm run backend' Enter
tmux send-keys -t "$S:dev.2" 'codex' Enter
tmux send-keys -t "$S:dev.3" 'npm run frontend' Enter

tmux select-pane -t "$S:dev.0"
echo "✓ Session '$S' — attach with: tmux attach -t $S"
"""

[pre-remove]
tmux = "tmux kill-session -t {{ branch | sanitize }} 2>/dev/null || true"
```

`pre-remove` stops all services when the worktree is removed.

To create a worktree and immediately attach:

```bash
$ wt switch --create feature -x 'tmux attach -t {{ branch | sanitize }}'
```

## Xcode DerivedData cleanup

Clean up Xcode's DerivedData when removing a worktree. Each DerivedData directory contains an `info.plist` recording its project path — grep for the worktree path to find and remove the matching build cache:

```toml
# ~/.config/worktrunk/config.toml
[post-remove]
clean-derived = """
  grep -Fl {{ worktree_path }} \
    ~/Library/Developer/Xcode/DerivedData/*/info.plist 2>/dev/null \
  | while read plist; do
      derived_dir=$(dirname "$plist")
      rm -rf "$derived_dir"
      echo "Cleaned DerivedData: $derived_dir"
    done
"""
```

This precisely targets only the DerivedData for the removed worktree, leaving caches for other worktrees and the main repository intact.

## Subdomain routing with Caddy
<!-- Hand-tested 2026-03-07 -->

Clean URLs like `http://feature-auth.myproject.localhost` without port numbers. Useful for cookies, CORS, and matching production URL structure.

**Prerequisites:** [Caddy](https://caddyserver.com/docs/install) (`brew install caddy`)

```toml
# .config/wt.toml
[post-start]
server = "npm run dev -- --port {{ branch | hash_port }}"
proxy = """
  curl -sf --max-time 0.5 http://localhost:2019/config/ || caddy start
  curl -sf http://localhost:2019/config/apps/http/servers/wt || \
    curl -sfX PUT http://localhost:2019/config/apps/http/servers/wt -H 'Content-Type: application/json' \
      -d '{"listen":[":8080"],"automatic_https":{"disable":true},"routes":[]}'
  curl -sf -X DELETE http://localhost:2019/id/wt:{{ repo }}:{{ branch | sanitize }} || true
  curl -sfX PUT http://localhost:2019/config/apps/http/servers/wt/routes/0 -H 'Content-Type: application/json' \
    -d '{"@id":"wt:{{ repo }}:{{ branch | sanitize }}","match":[{"host":["{{ branch | sanitize }}.{{ repo }}.localhost"]}],"handle":[{"handler":"reverse_proxy","upstreams":[{"dial":"127.0.0.1:{{ branch | hash_port }}"}]}]}'
"""

[pre-remove]
proxy = "curl -sf -X DELETE http://localhost:2019/id/wt:{{ repo }}:{{ branch | sanitize }} || true"

[list]
url = "http://{{ branch | sanitize }}.{{ repo }}.localhost:8080"
```

**How it works:**

1. `wt switch --create feature-auth` runs the `post-start` hook, starting the dev server on a deterministic port (`{{ branch | hash_port }}` → 16460)
2. The hook starts Caddy if needed and registers a route using the same port: `feature-auth.myproject` → `localhost:16460`
3. `*.localhost` resolves to `127.0.0.1` via the OS
4. Visiting `http://feature-auth.myproject.localhost:8080`: Caddy matches the subdomain and proxies to the dev server

## Monitor hook logs

Follow background hook output in real-time:

```bash
$ tail -f "$(wt config state logs get --hook=user:post-start:server)"
```

The `--hook` format is `source:hook-type:name` — e.g., `project:post-start:build` for project-defined hooks. Use `wt config state logs get` to list all available logs.

Create an alias for frequent use:

```bash
$ alias wtlog='f() { tail -f "$(wt config state logs get --hook="$1")"; }; f'
```

## Bare repository layout

A [bare repository](https://git-scm.com/docs/gitrepository-layout) has no working tree, so all branches — including the default — are [linked worktrees](https://git-scm.com/docs/git-worktree) at equal paths. No branch gets special treatment.

Cloning a bare repo into `<project>/.git` puts all worktrees under one directory:

```bash
$ git clone --bare <url> myproject/.git
$ cd myproject
```

With `worktree-path = "{{ repo_path }}/../{{ branch | sanitize }}"`, worktrees become subdirectories of `myproject/`:

```
myproject/
├── .git/       # bare repository
├── main/       # default branch
├── feature/    # feature branch
└── bugfix/     # bugfix branch
```

Configure worktrunk:

```toml
# ~/.config/worktrunk/config.toml
worktree-path = "{{ repo_path }}/../{{ branch | sanitize }}"
```

Create the first worktree:

```bash
$ wt switch --create main
```

Now `wt switch --create feature` creates `myproject/feature/`.

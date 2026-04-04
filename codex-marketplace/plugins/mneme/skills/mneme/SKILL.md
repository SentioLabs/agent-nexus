---
name: mneme
description: >
  Use mneme CLI (execute, exec-file, batch, fetch, search, index) instead of Bash/Read/Grep when
  processing large outputs. This skill protects your context window by running commands in a sandbox
  and only returning search results. Make sure to use this skill whenever the user asks to analyze
  build output, summarize logs, process data, parse JSON, filter results, extract errors, check
  build output, analyze dependencies, process API responses, do large file analysis, run tests and
  check output, review git log or recent commits, diff between branches, find TODOs, count lines,
  check codebase statistics, fetch documentation, call APIs, or any operation that may produce more
  than 20 lines of output. The PreToolUse hook enforces routing automatically for curl/wget.
---

# mneme -- context window protection

## Codex Transparency

When the Codex plugin hooks are installed, mneme can route eligible tool usage transparently.
For Codex packaging, hook commands should target a reachable daemon explicitly:

```bash
mneme hook <event> --platform codex --server 127.0.0.1:7435
```

This enables transparent context reduction for large-output operations and session memory recall
without requiring users to say "use mneme" on every turn.

## Prerequisites

The `mneme` binary must be available. Check with `which mneme`. If not found:

```bash
# If in the mneme repo with a compiled binary:
./target/release/mneme --version

# Otherwise build from source:
git clone https://github.com/sentiolabs/mneme
cd mneme
cargo build --release
cp target/release/mneme ~/.cargo/bin/
```

The mneme server must be reachable for transparent Codex hook workflows and for runtime-backed CLI operations (including fetch/search/index, execute/exec-file/batch, and memory commands):

```bash
mneme server start
```

If `mneme` is genuinely unavailable, fall back to the Grep tool with targeted file-type filters and small result sets, or use other available sandbox tools (ck-search, etc.) that keep output out of context.

## Tool Routing

For the routing commands in this guide, prefer long flags (`--lang`, `--code`, `--path`, `--url`) for consistency. Some subcommands expose short aliases (for example `mneme memory add -t ...`).

| Instead of... | Use... |
|---|---|
| `Bash` with large output | `mneme execute --lang shell --code '...'` |
| `Bash` with curl/wget | `mneme fetch --url <url>` then `mneme search '...'` |
| `Read` for analysis (not editing) | `mneme exec-file --path <file> --lang python --code '...'` |
| `Grep` with many results | `mneme execute --lang shell --code 'grep ...'` |
| Multiple commands + analysis | `mneme batch --commands-json '[...]' --queries-json '[...]'` |
| "What should I do before X?" / recalling preferences | `mneme memory search "query"` |

**When to use Read instead of exec-file**: If you are reading a file in order to **Edit** it, use Read -- you need the content in context for the edit. Use exec-file only when you are reading to **analyze or summarize**.

## Blocked Commands

These are intercepted by the PreToolUse hook and will be rejected:

- `curl` / `wget` in Bash -- Use `mneme fetch --url <url>` instead
- `fetch('http...` / `requests.get(` / `requests.post(` in Bash -- Use `mneme execute` instead

**Note:** WebFetch is allowed. Content fetched via WebFetch is automatically indexed by mneme and available for future `mneme search` lookups. If the same URL was fetched before, cached content is injected as context automatically (no re-fetch needed). You can also use `mneme fetch --url <url>` which returns clean markdown content directly and indexes it for search.

## Usage Examples

### Run tests and analyze output

```bash
mneme batch --commands-json '[{"language":"shell","code":"cargo test 2>&1"}]' \
  --queries-json '["test failures","FAILED","compilation error","warning"]'
```

### Execute code in sandbox

```bash
mneme execute --lang python --code 'import json; data = json.load(open("/path/to/large.json")); print(len(data["items"]))'
mneme execute --lang shell --code 'find . -name "*.rs" | wc -l'
```

### Analyze a file without flooding context

```bash
mneme exec-file --path src/main.rs --lang python --code 'lines = content.splitlines(); print(f"Lines: {len(lines)}"); print("Imports:", [l for l in lines[:20] if l.startswith("use ")])'
```

### Fetch and index web content

```bash
mneme fetch --url https://docs.example.com/api
```

Content is returned as clean markdown (HTML converted via readability + html-to-markdown). Use `mneme search` for follow-up queries on the indexed content:

```bash
mneme search "authentication endpoints"
```

Note: `mneme fetch` does not support custom HTTP headers. For APIs requiring authentication or User-Agent headers (like GitHub's API), use `mneme execute` with a script:

```bash
mneme execute --lang python --code '
import urllib.request, json
req = urllib.request.Request("https://api.github.com/repos/owner/repo/releases/latest",
    headers={"User-Agent": "mneme"})
data = json.loads(urllib.request.urlopen(req).read())
print(json.dumps({"tag": data["tag_name"], "date": data["published_at"]}, indent=2))
'
```

### Multi-step batch operation

```bash
mneme batch --commands-json '[{"language":"shell","code":"cargo test 2>&1"},{"language":"shell","code":"cargo clippy 2>&1"}]' \
  --queries-json '["test failures","clippy warnings"]'
```

### Index content for later search

```bash
mneme index --source "error-log" --path /tmp/error.log
mneme search "connection timeout errors"
```

### Query knowledge base

```bash
mneme search "how does authentication work"
mneme search "database schema" --source "architecture-docs"
```

### Search agent memories

Use `mneme memory search` to find stored preferences, knowledge, and decisions:

```bash
mneme memory search "before pushing code"
mneme memory search "testing strategy" --limit 5
```

Use `mneme memory recall` for a context-free top-K recall (no query argument — returns highest-confidence memories):

```bash
mneme memory recall --top-k 5
```

**Important:** `memory search` takes a `<QUERY>` positional argument. `memory recall` takes **no** positional argument — it only accepts options (`--top-k`, `--format`). Do not pass a query string to `recall`.

Memories are automatically scoped by your working directory — the server resolves CWD against registered paths for hierarchical recall (closest path ancestor scores highest).

## Output Constraints

- Keep responses under 500 words
- Write artifacts (code, configs) to FILES -- never return them as inline text
- Return only: file path + 1-line description

## Subagent Usage

Subagents automatically receive mneme tool routing via the PreToolUse hook. You do NOT need to manually add tool names to subagent prompts -- the hook injects them.

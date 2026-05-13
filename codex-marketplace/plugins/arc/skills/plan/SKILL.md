---
name: plan
description: You MUST use this skill to break a design or feature into implementation tasks — especially after brainstorming, when the user says "plan this", "break this down", "create tasks", or wants to turn a design into actionable arc issues with exact file paths. Creates self-contained arc issues that subagents can implement with zero prior context. Always prefer this over generic planning when the project uses arc issue tracking.
---

# Plan — Implementation Task Breakdown

Break an approved design into bite-sized, self-contained tasks with exact file paths and steps.

## Review Commands

Design docs live in `docs/plans/<file>.md`. The brainstorm skill registers each doc on one of three review surfaces and writes a routing marker as line 1 of the doc itself:

```markdown
<!-- arc-review: kind=<legacy|share-local|share-remote> id=<id> -->
```

Always read the marker before invoking any review CLI. The plan skill's CLI calls branch on `kind`:

| kind | Show content | List comments | Pull accepted | Approve | Update content |
|---|---|---|---|---|---|
| `legacy` | `arc plan show <id>` | `arc plan comments <id>` | n/a; review thread inline | `arc plan approve <id>` | re-create the plan (no in-place update) |
| `share-local` | `arc share show <id>` | `arc share comments <id>` | `arc share pull <id>` | `arc share approve <id>` | `arc share update <id> <path>` |
| `share-remote` | `arc share show <id>` | `arc share comments <id>` | `arc share pull <id>` | `arc share approve <id>` | `arc share update <id> <path>` |

Read the marker with one shell call:

```bash
MARKER=$(head -1 docs/plans/<file>.md)
KIND=$(echo "$MARKER" | grep -oE 'kind=[a-z-]+' | cut -d= -f2)
ID=$(echo "$MARKER" | grep -oE 'id=\S+' | sed 's/id=//' | tr -d '>' | xargs)
```

For encrypted shares, the author's edit tokens live in the arc-server's local keyring (`shares` table in `~/.arc/data.db`), not in any JSON file. `arc share show <id> --author-url` reprints the Author URL if it is lost. Legacy plans do not have edit tokens.

**Fallback for unmarked design docs:** Older docs may not have the marker. If the marker is missing, fall back to reading the file directly, but warn the user that review-state CLI routing will not work without a registered review surface.

## Granularity Rule

Each task step is **ONE action, 2-5 minutes**. Assume the builder has **zero codebase context**. If a step says "add validation" without showing the code, it's too vague.

## No Placeholders

Every step in a task description must contain the actual content a builder needs. These are **plan failures** — never write them:

- `"Add appropriate error handling"` / `"add validation"` / `"handle edge cases"` — show the actual code
- `"Write tests for the above"` without test code — include the test code
- `"Similar to Task N"` — repeat the content; the builder has zero context of other tasks
- Steps that describe what to do without showing how — code blocks required for code steps
- References to types, functions, or methods not defined in any task or already on HEAD
- `"TBD"`, `"TODO"`, `"implement later"`, `"fill in details"`

Code blocks represent the **intent, structure, and behavior** — not a character-for-character mandate. The builder follows the code block's signatures, logic, and patterns but adapts naming, error handling, and scaffolding to match project conventions (consistent with the builder's Gate Check 4: Idiomatic Code Quality). Task-internal Design Contracts remain pseudocode that the builder adapts to language idioms. The anti-placeholder rule prevents missing guidance, not idiomatic adaptation.

## Workflow

Add visible progress items for each step below. In Codex, use `update_plan`; in runtimes with task-list primitives, use the runtime's task tool. If continuing from the brainstorm skill, keep the brainstorm items visible alongside the planning items so the user sees the full brainstorm -> plan progression.

### 1. Read the Design

You're handed a plan-file path, typically `docs/plans/<file>.md`, by the brainstorm skill. Read line 1 to learn which review surface the plan lives on, then call the matching show command:

```bash
MARKER=$(head -1 docs/plans/<file>.md)
KIND=$(echo "$MARKER" | grep -oE 'kind=[a-z-]+' | cut -d= -f2)
ID=$(echo "$MARKER" | grep -oE 'id=\S+' | sed 's/id=//' | tr -d '>' | xargs)

case "$KIND" in
  legacy) arc plan show "$ID" ;;
  share-local|share-remote) arc share show "$ID" ;;
  *) echo "No review marker; reading file directly"; cat docs/plans/<file>.md ;;
esac
```

The full content is what you'll break down. If the file has no marker, reading it directly is fine, but warn the user that review-state CLI calls will not work without a registered review surface.

### 2. Identify Shared Contracts (Foundation Task)

Check the design for **shared contracts** — types, interfaces, config keys, constants, or function signatures referenced by multiple tasks. If the brainstorm design includes a shared contracts section, use it as input.

If shared contracts exist and parallel execution is likely:

1. Create a **T0: Foundation** task that establishes all shared contracts
2. Mark all parallelizable tasks as **blocked by T0**
3. T0 runs sequentially before any parallel batch begins

This ensures parallel agents inherit shared definitions from HEAD rather than inventing them independently. T0 owns those shared files while establishing them; later tasks may depend on them, but any further edits to the same file must happen in an explicitly serialized follow-up task.

**T0 task descriptions must be literal, not prose.** The description should contain:
- **Exact type/interface code** to write to specific files (sourced from the brainstorm design's shared contracts)
- **Inline contract test assertions** to write in each relevant test file, so downstream tasks can verify they are using the correct types
- Steps that say "write this exact code to this exact file" — not vague instructions like "define the memory type"

Example T0 task description:

```markdown
## Summary
Establish shared types and contract tests for the memory feature.

## Files
- Create: `internal/types/memory.go`
- Create: `internal/memory/memory_test.go`

## Scope Boundary
Do NOT create or modify any files outside the Files section above.

## Steps
1. Create `internal/types/memory.go` with this exact content:
   ```go
   package types

   import "time"

   type Memory struct {
       ID        int64     `json:"id" db:"id"`
       Content   string    `json:"content" db:"content"`
       CreatedAt time.Time `json:"created_at" db:"created_at"`
   }
   ```
2. Create contract assertions in `internal/memory/memory_test.go`:
   ```go
   package memory

   import (
       "testing"
       "time"

       "yourmodule/internal/types"
   )

   // --- Contract assertions ---
   // These verify the design spec. Do NOT modify
   // without updating the approved plan.

   func TestMemoryContract(t *testing.T) {
       m := types.Memory{}
       var _ int64 = m.ID
       var _ string = m.Content
       var _ time.Time = m.CreatedAt
   }

   // --- Behavior tests (added by builder) ---
   ```
3. Run `go build ./internal/types/...` — confirm it compiles
4. Run `go test ./internal/memory/...` — confirm contract tests pass
5. Commit: `feat(types): add foundation types and contract tests`

## Test Command
go test ./internal/memory/...

## Expected Outcome
Shared types compile and contract assertions pass. Parallel tasks can now import these types from HEAD.
```

**Skip this step** if the work is purely sequential or no shared contracts were identified.

### 3. Identify Tasks

Break the design into self-contained implementation units. Each task should:
- Have a clear, testable outcome
- Be implementable without knowledge of other tasks
- Include exact file paths for all files to create or modify
- Follow a logical dependency order
- **Not overlap in file ownership with other tasks in the same parallel batch**

When identifying tasks, assign **file ownership** per execution phase:
- Within a parallel batch, each file must be owned by exactly one task.
- Across serialized tasks, a later task may take ownership of a file after an earlier task completes; make that handoff explicit in the dependency order.

If two tasks need to modify the same file, either merge them into one task, serialize them with a dependency, or extract the shared file work into the foundation task.

### 4. Create Epic and Tasks via issue-manager

**Never run `arc create` directly** — always delegate to the `issue-manager` agent. This keeps bulk CLI output in a disposable subagent context.

Read the full plan content first using the kind-aware case from step 1, then build a task manifest that includes:
1. **The epic** — its description will be populated by the agent from the plan file (see below)
2. **All child tasks** with self-contained descriptions

**Critical**: Do NOT paste or summarize the plan content into the agent prompt. Instead, pass the plan file path and let the agent read it directly. This prevents content loss from summarization.

You typically already have the plan file path from the brainstorm hand-off. If you only have the ID and need to find the file path, the lookup depends on `kind`:

```bash
# share-local / share-remote: keyring includes the plan_file mapping
arc share list --json | jq -r '.[] | select(.id=="<id>") | .plan_file'

# legacy: arc plan show prints "File: <path>" in its metadata header
arc plan show <id> | grep -oE '^File: \S+' | awk '{print $2}'
```

Then dispatch the manifest:

```
Spawn or dispatch the `issue-manager` agent with this manifest:

Create the following epic and tasks.
After creation, set dependencies and labels as listed.
Return a summary table mapping task names to arc IDs.

## Epic

### <epic title>
Type: epic
Plan file: <absolute path to the plan markdown file>

IMPORTANT: Read the plan file at the path above using the Read tool. Use the COMPLETE
file contents as the epic description. Do NOT summarize, truncate, or paraphrase —
copy the full file content verbatim as the description.

## Tasks

### T1: <title>
Type: task
Parent: <epic-id from above>
Description:
<full multi-line self-contained description>

### T2: <title>
Type: task
Parent: <epic-id from above>
Description:
<full multi-line self-contained description>

## Dependencies
- T2 blocked by T1
- T4 blocked by T3

## Labels
- T3: docs-only

## Required Output
| Task | Arc ID | Title |
|------|--------|-------|
| Epic | ...    | ...   |
| T1   | ...    | ...   |
```

**IMPORTANT**: The epic description MUST contain the complete approved design. The agent reads the plan file directly to avoid any summarization or content loss. The plan file is ephemeral; the epic description is the permanent record.

For each task, check whether **all** files in its `## Files` section are documentation (`.md`, `.txt`, `README`, `CHANGELOG`, or anything under `docs/`). If so, include it in the `## Labels` section with `docs-only`. Doc-only tasks skip TDD; the `build` skill routes them to `doc-writer` instead of `builder`.

### 5. Validate Returned Results

Before proceeding, verify the agent's output:

1. **Count check**: The number of returned IDs must match the number of tasks in your manifest
2. **Spot-check**: Run `arc show <id>` on one returned task to confirm it exists and has the correct parent
3. **If mismatch**: Re-dispatch the agent for missing tasks only, or create them manually

### 6. Append Task Breakdown to Epic Description

The epic was created in step 4 with the full design content. Now append the task breakdown table (with actual arc IDs from step 5) to the epic's description:

```bash
arc update <epic-id> --stdin <<'EOF'
<existing epic description — the full design content from step 4>

---

## Implementation Tasks

<task breakdown table with arc IDs, titles, statuses, and dependency info>
EOF
```

**IMPORTANT**: Preserve the full design content already in the description — do not replace it with a summary. The epic description is the permanent record of the design. Only append the task breakdown table at the end.

### 6.5. Self-Review

After writing all tasks, review the plan against the design before proceeding:

1. **Spec coverage:** Skim each section/requirement in the design. Can you point to a task that implements it? If a gap exists, add the task.
2. **Placeholder scan:** Search all task descriptions for red flags from the No Placeholders list. Fix them.
3. **Type consistency:** Do the types, method signatures, and property names used in later tasks match what was defined in earlier tasks? A function called `clearLayers()` in T1 but `clearFullLayers()` in T3 is a bug.
4. **Step completeness:** Every code step has a code block. Every command step has the exact command and expected output. No exceptions.

Fix issues inline. No need to re-review — just fix and move on.

### 7. Choose Execution Path

Ask the user how to proceed. In Codex Plan mode, use `request_user_input` if available; otherwise ask a concise plain-text question and wait:

```
Question: "Epic and tasks created. How should we proceed with implementation?"
Options:
  - "Start implementing now" (invoke /arc:build in this session — subagents handle TDD per task)
  - "Implement in a new session" (provides the exact prompt to use)
  - "Done for now" (tasks are tracked in arc — implement manually or later)
```

After the user chooses:

**Start implementing now**: Invoke the `build` skill immediately with the epic ID.

**Implement in a new session**: Output the exact command for the user to copy-paste:
```
Run this in a new Claude Code or Codex session:

  /arc:build <epic-id>

```
Replace `<epic-id>` with the actual epic ID.

**Done for now**: Confirm the epic and tasks are saved in arc. The user can run `/arc:build <epic-id>` whenever they're ready.

## Task Description Format

Each task's `--description` must be self-contained, about 3-5k tokens. The task description is the implementation context; the builder loads `arc show <task-id>` and nothing else.

Include in every task description:

```
## Files
- Create: `path/to/new_file.go`
- Modify: `path/to/existing_file.go`
- Test: `path/to/file_test.go`

## Scope Boundary
Do NOT create or modify any files outside the Files section above.
If you need a type, interface, or constant that doesn't exist, do NOT create it —
the foundation task or a prior task is responsible for shared definitions.

## Design Contracts

### Shared (use verbatim — defined in T0: Foundation)
```go
type Memory struct {
    ID        int64     `json:"id" db:"id"`
    Content   string    `json:"content" db:"content"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}
```

### Task-internal
- `FeedbackRequest { memory_id: i64, rating: i8, comment: String? }`
- `MemoryStore.InsertMemory(content string) → (int64, error)`

## Steps
1. Write failing test for <specific behavior> in `path/to/file_test.go`
2. Run `go test ./path/to/...` — confirm it fails with <expected error>
3. Implement <specific function> in `path/to/new_file.go`:
   ```go
   func specificFunction(arg Type) (Result, error) {
       // exact implementation code — not prose descriptions
   }
   ```
4. Run `go test ./path/to/...` — confirm it passes
5. Commit: `feat(module): add <feature>`

## Test Command
go test ./path/to/...

## Expected Outcome
<what should work when this task is done>
```

**Hard rule:** Every code step requires a code block. Every command step requires the exact command and expected output. Steps without these are plan failures — see the No Placeholders section above.

### Design Contracts guidance

Include a `## Design Contracts` section in every non-T0 task description, placed after `## Scope Boundary` and before `## Steps`. This section has two subsections:

- **Shared (use verbatim)**: Exact type definitions copied from the T0 foundation task. The subagent MUST use these types exactly as written — same field names, same tags, same package. These are the canonical contracts established by T0 and committed to HEAD.
- **Task-internal**: Pseudocode descriptions of types and signatures that are private to this task. The subagent adapts these to language idioms (naming conventions, error handling patterns, etc.) as appropriate.

If a type the subagent needs is not listed in Design Contracts and is not already on HEAD from T0, the subagent must NOT create it. This rule complements the Scope Boundary section — Scope Boundary restricts file ownership, Design Contracts restricts type ownership.

For `docs-only` tasks, omit `## Test Command` and use `## Verification` instead:

```
## Verification
- All internal links resolve to existing files
- Heading hierarchy has no skipped levels
- Code blocks have language tags
```

## Rules

- Never reference external docs or the full plan in task descriptions — everything needed is in the description
- Design documents live in `docs/plans/` and are registered via one of `arc plan create` (legacy), `arc share create` (encrypted local), or `arc share create --remote` (encrypted remote). The brainstorm skill writes a `<!-- arc-review: kind=... id=... -->` marker as line 1 of the doc; always read the marker before invoking review CLIs.
- Task descriptions must include actual code guidance, not vague instructions
- Team preparation (teammate labels) is optional — only if user chooses team execution
- The plan skill creates tasks; it does not implement them
- The plan skill never runs `arc create` directly — always delegate to `issue-manager`
- Every task must include a `## Scope Boundary` section — no file modifications outside the `## Files` list
- No two parallelizable tasks may own the same file — resolve overlaps via foundation task, merging, or serialization
- Format all arc content (descriptions, plans, comments) per `skills/arc/_formatting.md`

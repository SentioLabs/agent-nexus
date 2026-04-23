---
name: brainstorm
description: Use this skill only when the user explicitly asks for the arc brainstorm workflow, such as "/arc:brainstorm", "arc:brainstorm", "arc brainstorm", or "use the arc brainstorm skill". Do not trigger for generic brainstorming, design exploration, architecture trade-off analysis, or phrases like "think through" unless the user names arc brainstorm. This skill writes designs to docs/plans/ and registers them for review via arc plan.
---

# Brainstorm — Design Discovery

Explore requirements through Socratic dialogue before any implementation begins.

## Hard Gate

**Do NOT write any implementation code, scaffold any project, or take any implementation action until the design is approved.** Brainstorming produces a design document — not code.

## Workflow

Create a task for each step below using `TaskCreate`. Mark each as `in_progress` when starting and `completed` when done. This creates a visible progress list in the CLI that carries forward into the plan skill.

### 1. Explore Project Context

- Check existing files, docs, recent commits
- Review existing arc issues (`arc list`)
- Understand what already exists and what constraints are in play

**Efficient codebase exploration:** Prefer higher-level tools over raw text search to minimize exploration rounds:

1. **Semantic search** (ck-search or equivalent) — for conceptual questions like "how does this codebase handle authentication?" or "where is config loaded?". One semantic or hybrid search typically surfaces the right files vs. 5-10 rounds of keyword guessing with Grep.
2. **Symbol-level navigation** (Serena or equivalent) — once you've found relevant files, use symbol overview and reference-finding tools to understand structure without reading entire files. Get the class/function layout first, then read only the symbol bodies you need.
3. **Grep/Glob** — for exact symbol lookups (specific function names, constants, imports) where you already know the keyword.

The goal is to build a mental model of the relevant codebase areas in 2-3 targeted tool calls, not 10+ fishing expeditions.

### 2. Ask Clarifying Questions

- Ask questions **one at a time** — don't dump a list
- **Use the AskUserQuestion tool** for multiple-choice decisions (2-4 options)
- Use open-ended text questions only when you need freeform feedback
- Understand: purpose, constraints, success criteria, target users
- Continue until you have enough to propose approaches

**Example AskUserQuestion usage:**
```
Question: "How should we handle session persistence?"
Options:
  - "In-memory only" (simplest, lost on restart)
  - "SQLite" (persistent, single-node, matches existing storage)
  - "Redis" (distributed, adds infrastructure dependency)
```

### 3. Propose 2-3 Approaches

- Each approach: summary, trade-offs, estimated complexity
- Include a recommendation with reasoning
- **Use the AskUserQuestion tool** to present approaches as structured choices
- Apply YAGNI — remove features from all designs that aren't explicitly required

**Example AskUserQuestion usage:**
```
Question: "Which approach should we go with?"
Options:
  - "Approach A: ..." (recommended — trade-offs...)
  - "Approach B: ..." (trade-offs...)
  - "Approach C: ..." (trade-offs...)
```

### 4. Present Design Section by Section

- Break the design into logical sections (data model, API, UI, etc.)
- Present each section and get user approval before moving to the next
- Iterate on sections as needed based on feedback

### 5. Identify Shared Contracts (Parallel Readiness)

If the design will produce multiple implementation tasks that could run in parallel, explicitly identify the **shared contracts** — types, interfaces, config keys, constants, and function signatures that multiple tasks will reference.

Contracts fall into two tiers:

- **Shared contracts** (referenced by 2+ tasks): produce **exact, copy-pasteable code blocks** including the type definition AND a contract test assertion. The T0 foundation task will write these verbatim.
- **Task-internal types** (used within a single task): use typed pseudocode (e.g., `FeedbackRequest { memory_id: i64, rating: i8 }`) — the subagent adapts to language idioms during implementation.

Present shared contracts to the user as a "foundation layer" with exact code:

```go
// internal/types/config.go

// SessionConfig holds session-related settings.
type SessionConfig struct {
	Timeout  time.Duration `json:"timeout"`
	MaxIdle  int           `json:"max_idle"`
	Secure   bool          `json:"secure"`
}
```

```go
// internal/storage/storage.go

// GetSession retrieves a session by ID.
// Returns nil and no error if the session does not exist.
GetSession(ctx context.Context, id string) (*Session, error)
```

Contract test assertions verify that the shared types satisfy compile-time expectations. Place these **inline in each relevant test file** with a clear separator:

```go
// internal/types/config_test.go

// --- Contract assertions ---

// Verify SessionConfig fields exist with expected types.
var _ time.Duration = SessionConfig{}.Timeout
var _ int = SessionConfig{}.MaxIdle
var _ bool = SessionConfig{}.Secure
```

```go
// internal/storage/sqlite/sqlite_test.go

// --- Contract assertions ---

// Verify SQLiteStore satisfies the Storage interface.
var _ storage.Storage = (*SQLiteStore)(nil)
```

These exact definitions and contract tests become the **T0 foundation task** during planning — implemented sequentially before any parallel work begins. The T0 task writes the shared type files and embeds contract test assertions inline in each relevant test file, so that parallel agents can import these types immediately and any drift is caught at compile time.

**Skip this step** if the design maps to a single task or purely sequential work.

### 6. Save Design and Register for Review

Write the design document to `docs/plans/` and register it as an ephemeral plan for review:

```bash
# Write the design markdown file
# Use YYYY-MM-DD-<topic>.md naming convention
cat > docs/plans/YYYY-MM-DD-<topic>.md <<'EOF'
<design content>
EOF

# Register the plan for review (returns a plan ID + planner URL)
arc plan create docs/plans/YYYY-MM-DD-<topic>.md
```

The `arc plan create` command returns a plan ID. Use the plan ID to construct the planner URL in the next step.

### 7. Review Loop

After `arc plan create` returns the plan ID, **ALWAYS output the planner URL** so the user can click it directly in their terminal. The `arc plan create` command prints this URL, but also output it yourself to be sure:

```
Plan ready for review:

  http://localhost:7432/planner/<plan-id>

```

Replace `localhost:7432` with the actual server URL if different (check `ARC_SERVER` env var or the arc config).

Then use the **AskUserQuestion tool** — include the planner URL directly in the options so the user sees it without scrolling:
```
Question: "Plan ready for review at http://localhost:7432/planner/<plan-id> — how would you like to proceed?"
Options:
  - "Approve" (proceed to /arc:plan for implementation breakdown)
  - "I've submitted feedback in the planner (http://localhost:7432/planner/<plan-id>)" (read comments, revise, re-present)
  - "Save for later" (leave as draft — resume in a new session)
```

**If user approves:**
```bash
arc plan approve <plan-id>
```
Then proceed to step 8.

**If user says "feedback submitted":**
```bash
# Read review comments
arc plan comments <plan-id>
# Also re-read the file content in case the user edited it in the planner
arc plan show <plan-id>
```
Revise the design file based on the feedback, then re-present the planner URL and options. Repeat until approved.

**If user says "save for later":**
Tell the user they can resume by running `/arc:brainstorm` in a new session and referencing the plan file and plan ID.

### 8. Routing Analysis & Transition

After the plan is approved, **you MUST produce a routing analysis before presenting options**. This analysis helps the user make an informed decision about what to do next.

#### Routing Analysis

Evaluate the approved design against these criteria and present a summary:

| Factor | Assessment |
|--------|------------|
| **Work items** | Count of distinct implementation tasks identified in the design |
| **Parallel readiness** | Were shared contracts identified in step 5? (yes = plan needed for T0 sequencing) |
| **Files touched** | Approximate number of files created or modified |
| **Layers crossed** | Which architecture layers are involved (storage, API, CLI, frontend, tests) |
| **Risk areas** | Any migrations, API changes, or breaking changes? |
| **Scale** | Small / Medium / Large (from Scale Detection table) |

Then produce a **recommendation** with reasoning:

```
📊 Routing Analysis
───────────────────
Work items:       N tasks identified
Parallel ready:   Yes/No (shared contracts in step 5)
Files touched:    ~N files across N directories
Layers crossed:   [storage, API, CLI, ...]
Risk areas:       [migrations, breaking changes, none, ...]
Scale:            Small / Medium / Large

➤ Recommendation: /arc:plan | /arc:implement
  Reason: <1-2 sentence justification based on the factors above>
```

**Routing rules** (use these to drive the recommendation):
- **→ arc:plan** when ANY of: 2+ work items, shared contracts exist, multiple layers crossed, migrations or breaking changes present, medium/large scale
- **→ arc:implement** when ALL of: single work item, no shared contracts, single layer, no risk areas, small scale
- When borderline, recommend `arc:plan` — the overhead of planning is low, but the cost of a disorganized multi-task implementation is high

After the analysis, use the **AskUserQuestion tool** — mark the recommended option:
```
Question: "Design approved! What's next?"
Options:
  - "Break into tasks with /arc:plan" (recommended — <brief reason from analysis>)
  - "Implement directly with /arc:implement" (for small, single-task work)
  - "Done for now" (design is saved — continue in a new session)
```

If `/arc:implement` is recommended instead, swap which option gets the "(recommended)" tag.

- **Break into tasks**: invoke the `plan` skill, passing the plan ID
- **Implement directly**: invoke the `implement` skill
- **Done for now**: tell the user the plan is approved and they can run `/arc:plan` in a new session

## Scale Detection

| Indicator | Scale | Structure |
|-----------|-------|-----------|
| Multiple phases, weeks of work, cross-cutting concerns | Large | Meta epic → phase epics → tasks |
| Single feature, days of work, contained scope | Medium | Epic → tasks |
| One task, hours of work, obvious approach | Small | Single issue |

## Rules

- The ONLY next skill after brainstorm is `plan` (or `implement` for small work)
- Never invoke implementation skills from brainstorm
- Design documents go in `docs/plans/` and are registered via `arc plan create <file-path>`
- Arc issues track persistent work; TaskCreate/TaskUpdate tracks workflow progress in the CLI
- YAGNI: if the user didn't ask for it, don't design it
- Format all arc content (descriptions, plans, comments) per `skills/arc/_formatting.md`

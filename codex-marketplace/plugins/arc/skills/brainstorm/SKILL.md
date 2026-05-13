---
name: brainstorm
description: Use this skill when the user explicitly asks for the arc brainstorm workflow, such as "/arc:brainstorm", "arc:brainstorm", "arc brainstorm", or "use the arc brainstorm skill". This skill writes designs to docs/plans/ and registers them on one of three review surfaces: legacy `arc plan`, encrypted local `arc share`, or encrypted remote `arc share --remote`.
---

# Brainstorm - Design Discovery

Explore requirements through Socratic dialogue before any implementation begins.

## Hard Gate

**Do NOT write any implementation code, scaffold any project, or take any implementation action until the design is approved.** Brainstorming produces a design document, not code.

## Pre-flight: Branch Setup

Before starting the design dialogue, perform the protected-branch check per `skills/arc/_branch-check.md`.

Brainstorm itself doesn't commit code, but the design doc, the planned tasks, the eventual build work, and the final commits will all land on whatever branch you start from. Catching trunk at this point avoids discovering at finish time that the whole session happened on `main`.

## Workflow

Create a visible progress list for each step below. In Codex, use `update_plan`; in runtimes with task-list primitives, use the runtime's task tool. Mark each item `in_progress` when starting and `completed` when done. Step 5.5 gets its own item whether or not the user opts into grilling; "No, proceed" still completes that step.

### 1. Explore Project Context

- Check existing files, docs, and recent commits
- Review existing arc issues (`arc list`)
- Understand what already exists and what constraints are in play

**Scope check before proceeding:** Before asking detailed clarifying questions, assess whether the request describes multiple independent subsystems, for example "build a platform with chat, storage, billing, and analytics." If so, help the user decompose into sub-projects first. Each sub-project gets its own brainstorm -> plan -> build cycle.

**Efficient codebase exploration:** Prefer higher-level tools over raw text search to minimize exploration rounds:

1. **Semantic search** (ck-search, Serena, or equivalent) for conceptual questions like "how does this codebase handle authentication?"
2. **Symbol-level navigation** once you've found relevant files. Get the class/function layout first, then read only the bodies you need.
3. **Grep/Glob/rg** for exact symbol lookups where you already know the keyword.

The goal is to build a mental model of the relevant codebase areas in a few targeted tool calls, not a long fishing expedition.

### 2. Ask Clarifying Questions

- Ask questions one at a time. Do not dump a list.
- For multiple-choice decisions, use `request_user_input` when available; otherwise ask a concise plain-text question and wait for the user's answer.
- Use open-ended text questions only when you need freeform feedback.
- Understand purpose, constraints, success criteria, and target users.
- Continue until you have enough to propose approaches.

**If the user forecloses clarifying questions up front** (for example "no clarifying questions, just proceed", "skip to the design", "don't ask, just build"), keep this step's questions to a minimum or skip them. Step 5.5 is the recovery loop in that case. Default 5.5's recommendation to "Yes, grill me" whenever step 2 was foreclosed, regardless of scale.

**Example structured-choice question:**

```text
Question: "How should we handle session persistence?"
Options:
  - "In-memory only" (simplest, lost on restart)
  - "SQLite" (persistent, single-node, matches existing storage)
  - "Redis" (distributed, adds infrastructure dependency)
```

### 3. Propose 2-3 Approaches

- Each approach: summary, trade-offs, estimated complexity
- Include a recommendation with reasoning
- Use a structured-choice question for approach selection
- Apply YAGNI: remove features from all designs that are not explicitly required

**Example structured-choice question:**

```text
Question: "Which approach should we go with?"
Options:
  - "Approach A: ..." (recommended - trade-offs...)
  - "Approach B: ..." (trade-offs...)
  - "Approach C: ..." (trade-offs...)
```

**Capability-aware hint:** When comparing approaches, surface which imply heavier Codex execution. Approaches with more cross-cutting concerns, more files touched, or tighter coupling will likely need stronger models, higher reasoning effort, more subagent dispatches, and more review cycles. Approaches that decompose into small mechanical tasks will iterate faster.

### 4. Present Design Section by Section

- Break the design into logical sections (data model, API, UI, etc.)
- Present each section and get user approval before moving to the next
- Iterate on sections as needed based on feedback

**Design for isolation and clarity:** Break the system into smaller units that each have one clear purpose, communicate through well-defined interfaces, and can be understood and tested independently. For each unit, you should be able to answer: what does it do, how do you use it, and what does it depend on.

**In existing codebases:** Follow existing patterns. Where existing code has problems that affect the work, include targeted improvements as part of the design. Do not propose unrelated refactoring.

### 5. Identify Shared Contracts (Parallel Readiness)

If the design will produce multiple implementation tasks that could run in parallel, explicitly identify the **shared contracts**: types, interfaces, config keys, constants, and function signatures that multiple tasks will reference.

Contracts fall into two tiers:

- **Shared contracts** (referenced by 2+ tasks): produce exact, copy-pasteable code blocks including the type definition and a contract test assertion. The T0 foundation task will write these verbatim.
- **Task-internal types** (used within a single task): use typed pseudocode, for example `FeedbackRequest { memory_id: i64, rating: i8 }`. The builder adapts these to language idioms during implementation.

Present shared contracts to the user as a foundation layer with exact code:

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

Contract test assertions verify that the shared types satisfy compile-time expectations. Place these inline in each relevant test file with a clear separator:

```go
// internal/types/config_test.go

// --- Contract assertions ---

// Verify SessionConfig fields exist with expected types.
var _ time.Duration = SessionConfig{}.Timeout
var _ int = SessionConfig{}.MaxIdle
var _ bool = SessionConfig{}.Secure
```

These exact definitions and contract tests become the T0 foundation task during planning.

Skip this step if the design maps to a single task or purely sequential work.

### 5.5. Grill the Design (Optional Stress-Test)

Before publishing the design for review, save the draft to disk and offer a stress-test pass. Both this step and step 6 need the design as a file on disk, so first:

- Write the design document to `docs/plans/` using `YYYY-MM-DD-<topic>.md` naming. Do this whether or not the user opts into grilling; step 6 picks it up either way.

Then run a relentless-interrogation pass that probes the drafted design for unresolved internal decisions before publishing. This is distinct from step 7's review loop: that one processes external reviewer feedback; this one finds gaps the design itself did not resolve.

**When to recommend it:** This is opt-in. Mark "grill" as recommended when the design appears Medium/Large per the Scale Detection table: multiple work items, multiple layers crossed, or migrations/breaking changes. For Small single-task work, default to "No, proceed."

**Always recommend grilling when step 2 was foreclosed:** If the user shut down clarifying questions up front, this is the recovery loop. Mark "Yes, grill me" as recommended regardless of scale.

Ask:

```text
Question: "Stress-test the design before publishing?"
Options:
  - "Yes, grill me" - interrogate decisions one at a time until we converge
  - "No, proceed" - skip to step 6 register for review
```

If "Yes", run the loop:

**Loop rules:**

- Walk the design's decision tree depth-first, ordered by dependency. Resolve decisions that constrain later answers first.
- Ask one question per turn. Mark the recommended option when using structured input. When one option is objectively dominant, a single recommendation is fine; do not rubber-stamp open questions just because you have an opinion.
- **Codebase-first rule:** Before each question, name the symbol, file, or pattern that would answer it. If you can name one, search first and only ask when the codebase does not or cannot answer.
- **Capture resolutions in-place:** Each resolved decision is an edit to `docs/plans/<file>.md`. Update the relevant section; do not maintain a separate Q&A log.

**Stop when any of:**

- The user says "done", "enough", or "stop"
- Two consecutive rounds surface no new unresolved branches
- The loop has run about 10 rounds. If open branches remain, add them as "Remaining Open Questions" in the design doc instead of asking another question.

Then proceed to step 6.

### 6. Register for Review

The design doc already exists on disk from step 5.5. This step registers it for review on the surface the user picks.

Arc supports three review surfaces. They differ along two axes: who reviews, and whether encryption plus annotation/accept-resolve UI is needed. Pick based on how the design will actually be reviewed.

Ask:

```text
Question: "How would you like to review this design?"
Options:
  - "Legacy planner (solo, plain HTTP, simplest)" - `arc plan` at /planner/<id>
  - "Encrypted local share (solo, annotations/accept-resolve)" - `arc share` on this machine
  - "Encrypted remote share (multiple reviewers)" - `arc share --remote`
  - "Save for later" - keep the saved file and stop; skip steps 7 and 8
```

Route on the answer:

| Choice | CLI to run | Marker `kind=` | URL printed |
|---|---|---|---|
| Legacy planner | `arc plan create docs/plans/<file>.md` | `legacy` | `Review at: http://localhost:7432/planner/<id>` |
| Encrypted local | `arc share create docs/plans/<file>.md` | `share-local` | `Preview URL (local-only - not reachable by others):` |
| Encrypted remote | `arc share create docs/plans/<file>.md --remote` | `share-remote` | `Author URL (keep private - open it, then use the in-page Share link button to copy a reviewer URL):` |
| Save for later | no command | no marker | n/a |

**Capture the ID and write the review marker.** After the create call succeeds, prepend a single HTML-comment line to the design doc so `plan` and any future skill that queries review state knows which CLI to call.

```bash
# Run the chosen CLI and capture stdout.
OUT=$(arc share create docs/plans/2026-05-01-foo.md --remote)
echo "$OUT"   # ALWAYS print verbatim; the user needs to see the URL.

# Extract the ID:
#   - share-local / share-remote: the URL fragment contains /share/<id>#...
#   - legacy: the first line is "Plan created: <id> (file: ..., status: ...)"
ID=$(echo "$OUT" | grep -oE '/share/[^#]+' | head -1 | sed 's|/share/||')
# For legacy, instead: ID=$(echo "$OUT" | grep -oE 'Plan created: \S+' | awk '{print $3}')

KIND="share-remote"   # legacy | share-local | share-remote

FILE="docs/plans/2026-05-01-foo.md"
if head -1 "$FILE" | grep -q '^<!-- arc-review:'; then
  sed -i.bak "1s|.*|<!-- arc-review: kind=$KIND id=$ID -->|" "$FILE" && rm "$FILE.bak"
else
  { echo "<!-- arc-review: kind=$KIND id=$ID -->"; cat "$FILE"; } > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
fi
```

The marker format is fixed: `<!-- arc-review: kind=<legacy|share-local|share-remote> id=<id> -->`. Always line 1, always exactly one space between fields.

**URL handling rules:**

- **Legacy**: print the `Review at:` line. Tell the user this URL is local-only.
- **Encrypted local**: print the Preview URL line. Tell the user it is not reachable from other machines.
- **Encrypted remote**: print the Author URL line. Then tell the user: "Open this URL yourself; that's the author view. To send a reviewer link, click the Share link button in the page header. Do not paste the Author URL into chat or tickets; the author token gives edit privileges."

The encrypted-share CLI persists the edit token and key into the local arc keyring (`shares` table in `~/.arc/data.db`). If a share Author URL is lost, regenerate it with `arc share show <id> --author-url`. Legacy plans do not have edit tokens.

### 7. Review Loop

Skip this step entirely if step 6's answer was "Save for later".

Otherwise, print the URL from step 6 again as a reminder. Ask:

```text
Question: "Design ready for review at <url> - how would you like to proceed?"
Options:
  - "Approve" - mark the design approved and proceed to step 8 routing analysis
  - "I've finished review (pull comments now)" - fetch reviewer feedback, apply edits, re-share if needed, repeat
  - "Pause review" - design is saved; resume in a new session
```

Branch the CLI by the marker's `kind`:

| kind | Approve | Pull comments |
|---|---|---|
| `legacy` | `arc plan approve <id>` | `arc plan comments <id>` (no accepted-only filter; review the thread inline) |
| `share-local` | `arc share approve <id>` | `arc share pull <id>` (accepted-only by default) |
| `share-remote` | `arc share approve <id>` | `arc share pull <id>` (accepted-only by default) |

Legacy plan comments do not have Accept/Resolve/Reject state. If comment volume grows, suggest re-creating the design as `share-local`.

After a refinement pass, if the design changed materially, update the review surface to match the new content:

| kind | Update CLI | ID stable? | Marker action |
|---|---|---|---|
| `share-local` / `share-remote` | `arc share update <id> <plan-file>` | yes | leave marker as-is |
| `legacy` | `arc plan create <plan-file>` | no; new ID | rewrite line 1 with the new ID |

Then loop back to step 7.

### 8. Routing Analysis & Transition

After the design is approved, produce a routing analysis before presenting options.

| Factor | Assessment |
|--------|------------|
| **Work items** | Count of distinct implementation tasks identified in the design |
| **Parallel readiness** | Were shared contracts identified in step 5? |
| **Files touched** | Approximate number of files created or modified |
| **Layers crossed** | Which architecture layers are involved |
| **Risk areas** | Any migrations, API changes, or breaking changes? |
| **Scale** | Small / Medium / Large |

Then produce a recommendation:

```text
Routing Analysis
Work items:       N tasks identified
Parallel ready:   Yes/No
Files touched:    ~N files across N directories
Layers crossed:   [storage, API, CLI, ...]
Risk areas:       [migrations, breaking changes, none, ...]
Scale:            Small / Medium / Large

Recommendation: /arc:plan | /arc:build
Reason: <1-2 sentence justification>
```

Routing rules:

- Recommend `arc:plan` when any of: 2+ work items, shared contracts exist, multiple layers crossed, migrations or breaking changes present, medium/large scale.
- Recommend `arc:build` when all of: single work item, no shared contracts, single layer, no risk areas, small scale.
- When borderline, recommend `arc:plan`.

Ask:

```text
Question: "Design approved! What's next?"
Options:
  - "Break into tasks with /arc:plan" (recommended when routing analysis says plan)
  - "Build directly with /arc:build" (for small, single-task work)
  - "Done for now" (design is saved; continue in a new session)
```

- **Break into tasks**: invoke the `plan` skill, passing the review ID from the line-1 marker.
- **Build directly**: invoke the `build` skill.
- **Done for now**: tell the user the design is approved and they can run `/arc:plan` in a new session.

## Scale Detection

| Indicator | Scale | Structure |
|-----------|-------|-----------|
| Multiple phases, weeks of work, cross-cutting concerns | Large | Meta epic -> phase epics -> tasks |
| Single feature, days of work, contained scope | Medium | Epic -> tasks |
| One task, hours of work, obvious approach | Small | Single issue |

## Rules

- The only next skill after brainstorm is `plan` or `build` for small work.
- Never invoke implementation skills from brainstorm.
- Design documents go in `docs/plans/` and are registered via one of three review surfaces: `arc plan create`, `arc share create`, or `arc share create --remote`.
- The skill writes a `<!-- arc-review: kind=... id=... -->` marker as line 1 of the doc so downstream skills can route CLI calls.
- Arc issues track persistent work; the runtime's task/progress tool tracks workflow progress in the current session.
- YAGNI: if the user didn't ask for it, don't design it.
- Format all arc content (descriptions, plans, comments) per `skills/arc/_formatting.md`.

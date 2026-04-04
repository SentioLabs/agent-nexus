# Arc Plugin Eval Suite

Evals validate that arc's skills and agents behave correctly — that the right skill triggers for a given user prompt, and that once triggered, the skill produces the right outputs with the right constraints. Without evals, skill regressions are invisible until they waste a real session.

## Why Evals Exist

Arc's workflow is a chain of skills and agents: brainstorm → plan → implement → review/evaluate → verify → finish. Each link has specific behavioral contracts — the implement skill must never write code directly, the evaluator must never read the diff, the reviewer must re-review after fixes. These contracts are easy to violate subtly (e.g., a model "helpfully" writing a quick fix instead of dispatching a subagent). Evals catch these violations before they compound into broken workflows.

## Structure

```
evals/
  triggers/                    # Does the right thing activate?
    skills.json                # Workflow skills (brainstorm, plan, implement, etc.)
    commands.json              # Slash commands (/arc:ready, /arc:create, etc.)
    agents.json                # Agent dispatch (issue-tracker, implementer, reviewer, evaluator, etc.)
  quality/                     # Once activated, does it behave correctly?
    brainstorm.json            # Brainstorm skill output (7 evals)
    plan.json                  # Plan skill output (5 evals)
    implement.json             # Implement skill output (16 evals)
    debug.json                 # Debug skill output (5 evals)
    verify.json                # Verify skill output (5 evals)
    evaluate.json              # Arc-evaluator agent output (13 evals)
    review.json                # Review skill output (7 evals)
    finish.json                # Finish skill output (6 evals)
  workspace/                   # Eval run artifacts (gitignored)
    quality/                   # Per-skill directories with eval output transcripts
      brainstorm/              # e.g., eval-1-output.md, eval-4-output.md
      implement/
      ...
    optimization/              # HTML reports from description optimization runs
      brainstorm_report.html
      ...
    trigger_arc_*.json         # Standalone trigger eval files (legacy format)
```

## Eval Types

### Trigger Evals

**Question**: Given this user prompt, does the correct skill/agent/command activate?

Each entry is a user query with a `should_trigger` boolean and a target. The eval checks whether the agent runtime would route the query to the right place.

```json
{
  "query": "I want to explore OAuth design trade-offs before writing code",
  "should_trigger": true,
  "target_skill": "arc:brainstorm",
  "note": "Design exploration with explicit 'before writing code' — brainstorm territory"
}
```

**Negative cases are equally important.** A trigger eval that only tests positive cases can't catch over-triggering — e.g., the brainstorm skill activating on "plan my vacation." Aim for ~60% positive, ~40% negative.

**Target fields** vary by what's being tested:
- `target_skill` — for skill routing (`arc:brainstorm`, `arc:plan`, etc.)
- `target_command` — for command routing (`arc:ready`, `arc:create`, etc.)
- `target_agent` — for agent dispatch (`arc:arc-implementer`, `arc:arc-evaluator`, etc.)

**Section headers** are organizational markers, not test cases:
```json
{
  "_comment": "=== ARC-EVALUATOR AGENT ===",
  "_target": "arc:arc-evaluator"
}
```

### Quality Evals

**Question**: Once the skill activates, does it produce the right behavior?

Each eval simulates a scenario and checks assertions against the output. Assertions come in two types:

| Type | Meaning | Example |
|------|---------|---------|
| `constraint` | Hard rule — violation means the skill is broken | "Output does NOT write implementation code directly" |
| `quality` | Behavioral expectation — desirable but not fatal if missed | "Dispatch prompt includes the design spec" |

```json
{
  "eval_id": 1,
  "eval_name": "Evaluator maintains information asymmetry",
  "prompt": "Evaluate ARC-5.2 (OAuth token refresh). Base SHA is abc1234...",
  "assertions": [
    {
      "id": 1,
      "text": "Output does NOT run `git diff` or read the diff of changes",
      "type": "constraint"
    },
    {
      "id": 2,
      "text": "Output uses `git diff --name-only` to discover changed files",
      "type": "quality"
    }
  ]
}
```

**Constraint failures** signal a real problem — the skill violated a hard rule. **Quality misses** may indicate the model took a different-but-valid path, or may indicate a genuine behavioral regression. Look at the transcript to decide.

### Workspace Artifacts

The `workspace/` directory holds outputs from eval runs. These are gitignored — they're ephemeral debugging artifacts, not source of truth.

- `quality/<skill>/eval-N-output.md` — transcript of what the model did for eval N. Read these when a quality assertion fails to understand *why*.
- `optimization/<skill>_report.html` — HTML reports from skill description optimization runs. Auto-refreshes every 5 seconds during a live optimization session.

## Running Evals

### Via skill-creator (recommended)

The `skill-creator` skill has built-in eval and benchmark capabilities. Run these from a **new session** (not the session where you edited the evals):

```
# Eval a specific skill's quality
/skill-creator Eval my arc evaluate quality evals

# Eval a specific skill's triggers
/skill-creator Eval my arc agent trigger evals for arc-evaluator

# Eval all arc skills
/skill-creator Eval my arc skills

# Benchmark with variance analysis across multiple runs
/skill-creator Benchmark my arc evaluate skill across 5 runs

# Optimize a skill description for better triggering
/skill-creator Optimize my arc evaluate skill description
```

**Why a new session?** The current session has the skill content loaded in context, which biases the model toward correct behavior. A fresh session tests whether the skill description alone is sufficient to drive correct behavior — which is what real users experience.

### What skill-creator does under the hood

1. **Trigger evals**: Feeds each query to the model and checks whether the target skill/agent/command activates. Reports pass rate as correct activations / total queries.
2. **Quality evals**: Feeds each prompt to the model (with the skill loaded), captures the output, and scores each assertion as pass/fail. Reports per-eval and aggregate pass rates.
3. **Benchmarks**: Runs the eval suite N times and reports variance — useful for catching flaky assertions that pass sometimes but not reliably.
4. **Optimization**: Iterates on the skill's `description` field (the trigger text) to improve trigger accuracy, generating comparison reports.

### Target Pass Rates

| Eval Type | Target | Why |
|-----------|--------|-----|
| Trigger evals | 90%+ | Below this, the skill activates unreliably or over-triggers |
| Quality evals | 80%+ | Some model variance is expected; below 80% signals a structural problem |

## Interpreting Results

### Trigger eval failures

A trigger failure means one of:
- **False negative** (should_trigger=true, didn't activate): The skill description isn't capturing this use case. Look at the query — does the description contain the key concepts the user expressed?
- **False positive** (should_trigger=false, activated anyway): The skill description is too broad. Look at what concept in the query caused the false match.

Fix trigger failures by editing the skill's `description` field in its SKILL.md frontmatter, not by changing the eval.

### Quality eval failures

A quality failure means one of:
- **Constraint violation**: The skill did something it must never do. This is a real bug — fix the skill prompt.
- **Quality miss**: The skill didn't do something it should. Read the workspace transcript (`workspace/quality/<skill>/eval-N-output.md`) to determine:
  - Did the model take a different-but-valid path? → The assertion may be too rigid. Consider relaxing it.
  - Did the model genuinely miss the behavior? → The skill prompt needs strengthening for this case.
  - Is this flaky across runs? → Run a benchmark (5+ runs) to check variance. Flaky assertions often indicate ambiguity in the skill prompt.

### The evaluator's evals specifically

The `evaluate.json` quality evals test the arc-evaluator agent's core properties:

| Eval cluster | What it tests | What failure means |
|---|---|---|
| Eval 1 | Information asymmetry | Evaluator read the diff or implementer's tests — independence compromised |
| Eval 2 | Independent test writing | Acceptance tests aren't derived from spec alone |
| Eval 3 | Worktree discipline | Evaluator tried to commit or clean up (worktree handles disposal) |
| Evals 4, 6 | Concrete findings | Findings are vague instead of actionable |
| Eval 5 | Ambiguity handling | Evaluator assumed instead of flagging spec ambiguity |
| Eval 7 | Edge case coverage | Evaluator didn't go beyond explicit spec requirements |
| Eval 8 | Untestable requirements | Evaluator didn't flag insufficient API surface |
| Eval 9 | CONCERNS verdict | Wrong severity — core behaviors pass but edge cases failed |
| Eval 10 | Report structure | Output doesn't follow the structured template (must include Implementation Health + Evaluator Setup sections) |
| Eval 11 | Mixed results handling | Complex multi-requirement evaluation with mixed pass/fail |
| Eval 12 | Broken build → FAIL | Evaluator reported BLOCKED when the implementer's build is broken — should be FAIL |
| Eval 13 | Evaluator setup failure → BLOCKED | Evaluator reported FAIL when its own tests didn't compile — should be BLOCKED |

The `implement.json` evals 10-16 test the orchestrator's integration with the evaluator:
- Eval 10: Handles evaluator FAIL by re-dispatching implementer
- Eval 11: Prioritizes evaluator spec-intent over reviewer code quality
- Eval 12: Applies circuit breaker after 3 evaluator cycles
- Eval 13: Skips evaluator for docs-only tasks
- Eval 14: Handles evaluator BLOCKED — does not blame implementer
- Eval 15: Handles evaluator FAIL due to broken implementer build
- Eval 16: Dispatches evaluator with worktree isolation

## Writing New Evals

### General principles

- **Be concrete**: Include project names, issue IDs, file paths, error messages. "Implement the task" is bad. "The arc-implementer just reported PASS on all gate checks for ARC-5.1" is good.
- **Add backstory**: Context makes the scenario realistic. "This is the 3rd review/fix cycle" triggers different behavior than "review this."
- **Test boundaries**: Include queries that are *close* to triggering but shouldn't. These catch over-broad descriptions.
- **Mix positive and negative**: ~60% should-trigger, ~40% should-not for trigger evals.
- **One behavior per eval**: Each quality eval should test one specific behavior. Don't combine "dispatches subagent" and "handles PARTIAL result" in the same eval.
- **Constraints vs quality**: Use `constraint` for rules that must never be violated (never write code, never read the diff). Use `quality` for expected-but-flexible behaviors (includes design spec in prompt, runs tests fresh).

### Adding evals for a new skill or agent

1. Create `quality/<skill-name>.json` with 5-10 evals covering:
   - Happy path (the skill does what it should)
   - Constraint enforcement (the skill doesn't do what it must not)
   - Edge cases (unusual inputs, error conditions, circuit breakers)
   - Handoff correctness (the skill transitions to the right next step)

2. Add trigger entries to the appropriate file in `triggers/`:
   - `skills.json` for workflow skills
   - `agents.json` for agents
   - `commands.json` for slash commands
   - Include 2-3 positive triggers and 2-3 negative triggers per target

3. Run the evals in a fresh session:
   ```
   /skill-creator Eval my arc <skill-name> quality evals
   ```

4. If pass rate is below target, read the workspace transcripts and iterate on either the skill prompt or the eval assertions.

### Eval maintenance

Evals need updating when:
- A skill's workflow changes (e.g., implement now dispatches evaluator + reviewer in parallel)
- New behaviors are added (e.g., evaluator circuit breaker in implement)
- An eval is consistently flaky across benchmark runs (ambiguous assertion or prompt)
- The eval count in this README's structure section drifts from actual file contents

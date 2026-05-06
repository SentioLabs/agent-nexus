---
name: slop-review
description: >
  Detect low-quality AI-generated code ("AI slop") in any codebase using a 4-lens parallel
  review architecture with model-tiered agents. Use this skill when the user asks to review
  code quality, audit files or PRs for AI-generated patterns, check if code is idiomatic,
  assess whether code looks AI-written, or asks anything like "review this for slop", "is
  this idiomatic?", "does this look AI-generated?", "what's wrong with this code?", "audit
  code quality", "find AI patterns", or raises concerns about architecture fit, wrong-problem
  solutions, abstraction boundaries, or PR strategy. Also trigger for general code review
  requests where idiomaticity, quality, or solution fit are the primary concern -- even if
  the user doesn't explicitly mention "AI slop". Trigger proactively after large AI-assisted
  code generation sessions when the user asks for a quality check. Supports Go, Python,
  Rust, and Svelte/TypeScript with language-specific reference files, but the universal
  signals apply to any language.
---

# AI Slop Review

Identify low-quality, likely AI-generated code and solution-level slop through a 4-lens
parallel review architecture. Specialized agents scan in parallel for AI authorship
signals, idiom violations, code quality issues, and whether the implementation is the
right solution to the problem. A calibration agent then scores and filters findings.
Only findings that survive calibration appear in the final report.

## Why four lenses matter

A single reviewer either blurs concerns together (mixing "is this AI-generated?" with
"is this good code?" and "is this the right solution?") or anchors too heavily on one
dimension. The 4-lens architecture separates these concerns so each agent can focus
deeply:

- **Phase 1a (AI Authorship Detection):** Looks for patterns that betray machine
  generation -- contextual blindness, boilerplate residue, aspirational documentation,
  mechanical uniformity. Not a code review; a forensic analysis.
- **Phase 1b (Idiom Fluency):** Checks whether the code reads like it was written by
  someone fluent in the language and its ecosystem. Compares against the project's own
  idiom baseline, not abstract ideals.
- **Phase 1c (Code Quality):** Traditional quality review -- dead code, stale docs,
  debug artifacts, test quality, security, DRY violations. Deliberately agnostic about
  whether code is AI-generated.
- **Phase 1d (Architecture and Solution-Fit):** Asks whether the implementation should
  exist in this shape. Locally clean code can still be slop if it patches a symptom,
  chooses the wrong owner, or ignores an existing tool or framework mechanism.

After the parallel scan, a calibration agent scores every finding on a 0-100 scale,
cross-references across lenses, and produces a filtered, verdict-bearing report.

The review must answer two separate questions:

- Is the code locally slop?
- Is the solution itself slop?

## Model Assignment

| Step | Agent | Model |
|------|-------|-------|
| Step 0 | Scope, problem reconstruction, and context gathering | Haiku |
| Phase 1a | AI Authorship Detection | Opus |
| Phase 1b | Idiom Fluency | Opus |
| Phase 1c | Code Quality | Sonnet |
| Phase 1d | Architecture and Solution-Fit | Opus |
| Phase 2 | Calibration | Opus |
| Phase 3 | Synthesis | inline (no subagent) |

When launching subagents, specify the `model` parameter explicitly:
- `model: "haiku"` for Step 0
- `model: "opus"` for Phase 1a, Phase 1b, Phase 1d, and Phase 2
- `model: "sonnet"` for Phase 1c

---

## Workflow

### Step 0: Determine scope, reconstruct the problem, gather context, and build idiom baseline

Launch a subagent with `model: "haiku"` for this step.

**Scope:** Determine what to review based on the user's request:
- If the user specifies files/directories, use those
- If the user says "review this PR" or "review my changes", use `git diff` to identify changed files
- If the user says "review the codebase" or similar broad request, scan `src/` or the main
  source directory, excluding vendored code, generated files, and test fixtures

**Problem reconstruction** (do this before any review -- it prevents solution-level false negatives):

For PRs and non-trivial changes, produce a short problem statement before launching Phase 1:

1. Identify the stated problem from PR title, description, linked issues, commits, and
   human reviewer comments
2. Identify the inferred actual failure mode from changed code, tests, logs, commands,
   and reproduction evidence
3. Identify existing mechanisms that already own the problem area: framework features,
   package managers, build tools, platform APIs, repo scripts, or established team flows
4. Identify the minimal solution that would solve the problem without new abstractions
5. Record unanswered questions where the PR does not explain why the chosen approach is necessary

For PR reviews, always read human reviewer comments before final grading. Treat comments
as context signals about requirements, missing evidence, tool mental models, and
solution-level objections -- not just as line-level code review inputs.

When PR comments include phrases like "why", "what problem", "anti-pattern", "wrong
layer", "should just work", "too much baggage", "AI fix this", or "do we need this",
route them to Phase 1d. These are usually architecture or solution-fit objections.

**Context gathering** (do this before any review -- it prevents false positives):

1. Read any project guidance files in the repo root and relevant subdirectories, especially
   `CLAUDE.md`, `AGENTS.md`, `README.md`, and contributor docs that define conventions,
   style rules, or architectural decisions
2. Sample 2-3 existing files in the same directory/package as the code under review to
   establish the project's baseline patterns:
   - Error handling style (how does this project handle errors?)
   - Import conventions (aliased? grouped? sorted?)
   - Naming patterns (camelCase? snake_case? abbreviations?)
   - Logging approach (which logger? structured? what level conventions?)
   - Test style (table-driven? fixtures? mocks? what framework?)
3. Detect the primary language(s) and load the appropriate reference file(s) from
   `${CLAUDE_PLUGIN_ROOT}/skills/slop-review/references/` -- only read reference files
   for languages actually present in the review scope

**Idiom baseline** (document this explicitly so Phase 1b has a concrete reference):

Produce a structured idiom baseline for each language in scope. This baseline is the
authority for Phase 1b -- anything matching it is NOT flagged. Include:

- **Language version:** e.g., Go 1.22, Python 3.12, Rust 2021 edition
- **Modern features in use:** e.g., `slog` vs `log`, `itertools` usage, `?` operator patterns
- **Stdlib preferences:** which standard library packages the project favors over third-party alternatives
- **Error handling convention:** e.g., sentinel errors vs custom types, `errors.Is`/`As` usage, bare `except` policy
- **Test framework:** e.g., `testing` + `testify`, `pytest`, `rstest`
- **Import conventions:** grouping order, aliasing patterns, relative vs absolute
- **Naming conventions:** abbreviation norms, exported/unexported patterns, file naming

**Scope adaptation for PR reviews:**

When reviewing a PR, also gather the base branch versions of changed files so that
Phase 1 agents can distinguish between pre-existing patterns and newly introduced ones.
Use `git show <base>:<path>` for each changed file.

Also gather the PR title, description, linked issues, commit list, changed-file list, and
human reviewer comments. Prefer `gh pr view --comments` plus the appropriate `gh api`
review-comment endpoints when available.

Store all gathered context (problem reconstruction, codebase context, idiom baseline,
base branch files, and reviewer comments) -- all Phase 1 agents and Phase 2 need it.

---

### Phase 1: Parallel 4-lens scan

Launch the applicable subagents in parallel. Each receives the files under review, the
problem reconstruction, codebase context, the idiom baseline, reviewer comments, and the
relevant language reference files from Step 0.

**Important:** Always use `general-purpose` subagents (or omit the `subagent_type` parameter).
Do NOT use specialized review agents (coderabbit, feature-dev, pr-review-toolkit, etc.) --
this skill provides its own complete review methodology, and specialized agents will blend
their own prompts with these instructions, producing inconsistent results.

For large reviews (>10 files), split each lens across multiple parallel subagents by
directory or module. Phase 1d should stay cross-cutting unless the PR spans genuinely
independent systems.

#### Phase 1a: AI Authorship Detection (model: "opus")

> You are an AI authorship forensic analyst. Your sole job is to identify code that was
> likely generated by an AI assistant rather than written by a human developer. You are
> NOT doing a general code review. Ignore human-style mistakes -- typos, inconsistent
> spacing, TODO hacks, quick-and-dirty solutions. Those are human signals, not problems
> for you to flag.
>
> Focus exclusively on these AI authorship signals:
>
> 1. **Contextual blindness** -- code that is locally coherent but unaware of its
>    surroundings: different error handling than the file it lives in, a utility that
>    duplicates one nearby, an abstraction that ignores established patterns, a different
>    logger/serializer/HTTP client than everything else uses. This is the strongest signal.
> 2. **Boilerplate residue** -- scaffolding, placeholder comments, template structure that
>    was never customized. Code that looks like it was accepted from a suggestion without
>    adaptation.
> 3. **Aspirational documentation** -- docstrings/comments that describe what the code
>    *should* do rather than what it *does*. README sections that describe features not
>    yet implemented. Comments that are more detailed than the code warrants.
> 4. **Over-engineering** -- abstractions with one implementation, factory patterns used
>    once, configuration for single-use code, defensive checks for impossible conditions.
>    AI models build for generality; humans build for the case at hand.
> 5. **Uniform mechanical style** -- suspiciously consistent formatting, identical
>    try/catch shapes across unrelated functions, uniform comment density. Human code
>    has texture and variation.
>
> For each finding, report:
> - **File** and **line number(s)**
> - The specific **code snippet**
> - **Signal category** (one of the five above)
> - **Reasoning** -- why this pattern indicates AI generation rather than human authorship
> - **Confidence** (0-100)
>
> At the end, produce a **per-file authorship assessment**:
> | File | AI Likelihood (0-100) | Primary Signals | Notes |
> |------|----------------------|-----------------|-------|
>
> Tag every finding with `[AI_AUTHORSHIP]`.

#### Phase 1b: Idiom Fluency (model: "opus")

> You are a language idiom expert. Your job is to identify code that is not idiomatic
> for its language, framework, and project context. You have the project's idiom baseline
> -- do NOT flag patterns that match the project's idiom baseline. Only flag deviations
> from established project conventions or from modern language best practices that the
> project has adopted.
>
> Focus on:
>
> 1. **Modern language features** -- using old patterns when the project's language version
>    supports better alternatives (e.g., `os.Open` error handling without `errors.Is` in a
>    Go 1.20+ project, manual loops instead of comprehensions in Python 3.10+)
> 2. **Stdlib usage** -- using third-party libraries for things the stdlib handles well,
>    or using deprecated stdlib APIs when modern replacements exist in the project's version
> 3. **Error handling** -- patterns that deviate from the project's established convention
>    (not from abstract ideals)
> 4. **Framework conventions** -- using a framework against its grain (e.g., fighting
>    Dagster's asset model, bypassing Django's ORM patterns when the project uses them)
> 5. **Naming and structure** -- names that don't follow the project's conventions,
>    file organization that breaks the established module structure
>
> For each finding, report:
> - **File** and **line number(s)**
> - The specific **code snippet**
> - **Signal category** (one of the five above)
> - **Idiomatic alternative** -- what the code should look like
> - **Reasoning** -- why the current code is non-idiomatic in this project's context
> - **Confidence** (0-100)
>
> Tag every finding with `[IDIOM]`.

#### Phase 1c: Code Quality (model: "sonnet")

> You are a code quality reviewer. Your job is to find concrete quality issues -- dead
> code, stale documentation, debug artifacts, test problems, security concerns, and DRY
> violations. Tag every finding as `[CODE_QUALITY]`. Do not speculate about whether code
> is AI-generated -- that is another reviewer's job. Focus only on whether the code is
> correct, maintainable, secure, and well-tested.
>
> Focus on:
>
> 1. **Dead code** -- unused imports, unreachable branches, commented-out code, unused
>    variables/functions
> 2. **Stale documentation** -- comments/docstrings that don't match the current code
>    behavior, outdated README sections, wrong parameter descriptions
> 3. **Debug artifacts** -- leftover print statements, hardcoded test values, disabled
>    tests, temporary workarounds marked TODO with no tracking
> 4. **Test quality** -- tests that don't test behavior, missing edge case coverage,
>    mocks that mock too much, tests that would pass even if the code were broken
> 5. **Security** -- SQL injection, path traversal, hardcoded secrets, unsafe
>    deserialization, missing input validation on external boundaries
> 6. **DRY violations** -- copy-pasted logic that should be extracted, duplicated
>    constants, repeated patterns that indicate missing abstractions
>
> For each finding, report:
> - **File** and **line number(s)**
> - The specific **code snippet**
> - **Signal category** (one of the six above)
> - **Reasoning** -- what the concrete quality issue is
> - **Confidence** (0-100)
>
> Tag every finding with `[CODE_QUALITY]`.

#### Phase 1d: Architecture and Solution-Fit Review (model: "opus")

Required for PRs and non-trivial changes. Optional for tiny single-file edits where the
user only asks about local code style and no architecture or workflow choice is involved.

> You are an adversarial architecture and solution-fit reviewer. Your job is to decide
> whether the implementation is the right solution to the problem, regardless of whether
> the changed code is locally correct.
>
> Do NOT focus on formatting, style, or small bugs. Focus on whether the PR should exist
> in this shape.
>
> Review these dimensions:
>
> 1. **Problem fit** -- Does the PR solve the actual problem, or only a symptom?
> 2. **Abstraction boundary** -- Is the solution implemented at the right layer, or does
>    it bypass the component, tool, or owner that should own the behavior?
> 3. **Existing mechanisms** -- Does the repo, framework, platform, package manager, or
>    third-party tool already provide a better solution?
> 4. **Scope control** -- Does the PR spread one issue across too many files, docs,
>    scripts, configs, workflows, or user surfaces?
> 5. **Maintenance cost** -- Does the solution create custom code that must track external
>    behavior, file formats, CLI output, or conventions unnecessarily?
> 6. **Operational behavior** -- Does the solution change user workflows, CI behavior,
>    failure modes, or target semantics in ways not justified by the problem?
> 7. **Evidence quality** -- Does the PR prove the problem and chosen solution, or does it
>    look like an "AI fix this" response to a guessed root cause?
> 8. **Education opportunity** -- If the author seems to misunderstand a tool, framework,
>    or architecture boundary, identify the missing mental model factually and
>    non-personally.
>
> For each finding, report:
> - **File(s) or PR area involved**
> - The **claimed or inferred problem**
> - Why the solution is **mismatched or over-scoped**
> - The **existing mechanism or simpler alternative**
> - **Evidence** from the repo, docs, commands, or reviewer comments
> - **Confidence** (0-100)
> - **Severity**: Low, Medium, High
>
> At the end, produce:
>
> | Dimension | Score (0-100) | Finding | Better Direction |
> |-----------|--------------:|---------|------------------|
>
> Tag every finding with `[SOLUTION_FIT]`.

---

### Phase 2: Calibration review (model: "opus")

Launch a **separate, independent** subagent with `model: "opus"`. This agent receives
ALL findings from all Phase 1 lenses, the original files, the problem reconstruction,
reviewer comments, the codebase context, and the idiom baseline.

> You are a senior staff engineer performing calibration review. You are fair, precise,
> and allergic to false positives. Your job is to take findings from the parallel
> reviewers (AI Authorship, Idiom Fluency, Code Quality, Architecture and Solution-Fit)
> and produce a unified, calibrated assessment.
>
> **For each finding, you must:**
>
> 1. Read the actual code at the referenced file:line
> 2. Read the surrounding context (the full function, the file's imports, nearby code)
> 3. Check the codebase context and idiom baseline -- does this project have a convention
>    that makes this OK?
> 4. Assign a **confidence score (0-100)** using this rubric:
>    - **0-25:** False positive. The finding is wrong or irrelevant.
>    - **26-50:** Nitpick. Technically true but not worth acting on.
>    - **51-70:** Low severity. Real issue but minor impact.
>    - **71-85:** Verified real. Clear problem that should be fixed.
>    - **86-100:** Confirmed critical. Significant issue affecting correctness, security,
>      or maintainability.
> 5. Render a **verdict**:
>    - **CONFIRMED** -- this is a real finding. Explain why it survives scrutiny.
>    - **DOWNGRADED** -- real but less severe than the scanner claimed. Adjust score and explain.
>    - **DISMISSED** -- false positive or nitpick. Explain what the scanner got wrong.
>    - **ESCALATED** -- worse than the scanner realized. Explain the additional concern.
> 6. **Re-tag** if the finding was categorized under the wrong lens (e.g., an idiom
>    finding tagged `[CODE_QUALITY]` should be re-tagged `[IDIOM]`).
> 7. Explicitly answer the solution-fit questions:
>    - Could this code be locally acceptable but still the wrong solution?
>    - Did the implementation choose the wrong owner or abstraction boundary?
>    - Did reviewer comments reveal a system-level objection the code lenses missed?
>    - Are there signs the engineer or AI assistant misunderstood a tool, framework, or
>      repo convention?
>    - Should the grade change because the solution is strategically poor even if the diff
>      is small?
>
> **Cross-finding analysis:**
>
> After processing individual findings, perform cross-lens analysis:
> - **Missed findings:** Flag anything the Phase 1 scanners missed that you notice while
>   verifying. The scanners may have been so focused on their checklists that they
>   overlooked issues hiding in plain sight.
> - **Cross-lens patterns:** Identify cases where findings from different lenses
>   reinforce each other (e.g., an `[AI_AUTHORSHIP]` contextual blindness finding
>   combined with an `[IDIOM]` finding on the same code strongly suggests AI generation).
>   Note these correlations explicitly.
> - **Solution-fit patterns:** Do not treat `[SOLUTION_FIT]` findings as optional
>   appendices. If the implementation strategy is wrong, it must affect the top-line grade.
> - **Reviewer comment classification:** Classify each substantive human reviewer comment:
>
> | Status | Meaning |
> |--------|---------|
> | Supported | Evidence confirms the reviewer is raising a real solution or code issue. |
> | Partially supported | The concern is directionally right, but narrower or lower severity. |
> | Not supported | The reviewer concern does not hold after checking repo reality. |
> | Needs clarification | The PR does not contain enough evidence to decide. |
>
> **File-level authorship table:**
>
> Produce a per-file authorship assessment for EVERY file in scope, incorporating
> Phase 1a's assessments and your own calibration:
>
> | File | AI Likelihood (0-100) | Calibrated Confidence | Key Signals | Verdict |
> |------|----------------------|----------------------|-------------|---------|
>
> Your output is the complete calibrated finding list with scores, verdicts, reasoning,
> cross-lens correlations, reviewer-comment classifications, solution_fit_score, and the
> file-level authorship table.

Provide the subagent with:
- All Phase 1a, 1b, 1c, and 1d findings
- The original files under review (so it can re-read them independently)
- The problem reconstruction, reviewer comments, codebase context, and idiom baseline from Step 0

---

### Phase 3: Synthesize, grade, and report

Merge the calibrated findings into the output format below. Apply these thresholds
for finding inclusion:

- **Score >= 70:** Include in the main report sections
- **Score 50-69:** Include in a borderline appendix
- **Score < 50:** Include in the dismissed findings section

#### Grading algorithm

Compute local code scores first, then combine them with solution-fit for the final grade.

**Step 1: Per-file dimension scores**

- **AI Likelihood** -- use the calibrated per-file score from Phase 2 (0-100)
- **Idiom Score** -- aggregate confirmed `[IDIOM]` findings for the file using
  density-weighted mean: `mean(finding_scores) * (1 + log2(count))`, capped at 100.
  If no idiom findings, score is 0.
- **Quality Score** -- aggregate confirmed `[CODE_QUALITY]` findings the same way:
  `mean(finding_scores) * (1 + log2(count))`, capped at 100. If no quality findings,
  score is 0.

**Step 2: Weighted file score**

```
file_score = (0.10 * ai_likelihood) + (0.40 * idiom_score) + (0.50 * quality_score)
```

Weights reflect that this is a *slop* review, not an *authorship* review. Good
AI-written code that follows idioms and has no quality issues should score well.
Authorship signals serve as corroborating evidence, not a primary driver.

**Step 3: Local code rollup**

```
code_local_score = Σ(file_score * file_loc) / Σ(file_loc)
```

Weight by lines of code so a 500-line file with issues matters more than a 10-line
utility.

**Step 4: Solution-fit score**

Use the calibrated Phase 1d and Phase 2 result as `solution_fit_score` (0-100). If Phase
1d was not applicable because the scope was a tiny local edit, omit `solution_fit_score`
and use `code_local_score` as the final score.

For PRs and non-trivial changes:

```
final_score = (0.60 * code_local_score) + (0.40 * solution_fit_score)
```

For PRs whose purpose is architecture, tooling, workflows, infrastructure, developer
experience, or process, solution fit matters equally:

```
final_score = (0.50 * code_local_score) + (0.50 * solution_fit_score)
```

This matters because AI-generated PRs often have clean syntax and decent local hygiene
while choosing the wrong overall approach.

**Step 5: Letter grade and verdict**

| Grade | Score | Verdict |
|-------|-------|---------|
| A | 0-20 | Clean |
| B | 21-40 | Mild concerns |
| C | 41-60 | Significant concerns |
| D | 61-80 | Strong slop signals |
| F | 81-100 | Pervasive slop |

---

## Universal Slop Signals

These apply to every language. The language-specific reference files add to these,
they don't replace them.

### Structural tells
- Functions named after *what they do* rather than *what they represent*
  (`processDataAndValidateInput`, `handleRequestAndReturnResponse`)
- Comments that restate the code verbatim -- no "why", only "what"
- Abstractions with exactly one implementation (premature interface/protocol/trait invention)
- Happy-path-only logic -- edge cases (nil/null/empty/zero/overflow) simply absent
- Hardcoded values that belong in config or named constants
- Inconsistent error message casing/formatting vs. the rest of the codebase

### Defensive over-engineering
- `try/except` or error handling around operations that cannot fail in context
- Redundant nil/null checks on values the type system or caller already guarantees
- Validation of internal function arguments that are only called from trusted code
- Feature flags, backwards-compatibility shims, or configuration for single-use code
- Factory/builder/strategy patterns used exactly once

### Documentation noise
- Docstrings that restate the function signature in prose ("Takes an X and returns a Y")
- `# increment counter` above `counter += 1`
- Module-level docstrings that describe what the file contains rather than why it exists
- Every function documented even when the name + signature is self-explanatory
- Type annotations in docstrings that duplicate the actual type annotations

### Copy-paste signatures
- Multiple functions with near-identical parameter lists suggesting generated boilerplate
- Repeated structural patterns (same try/catch shape, same logging preamble) across
  unrelated functions -- human code tends to vary more
- Suspiciously uniform formatting that doesn't match the rest of the file

### Test quality signals
- Tests named `TestSuccess` / `TestFailure` / `test_basic` with no scenario specificity
- Mocks that mock so much they don't test anything real
- No property-based, table-driven, or parametrized tests where the problem calls for them
- Assertions that only check happy-path return values, never error payloads or side effects
- Missing coverage for concurrency, timeout, and cancellation paths
- Test functions that verify the code compiles/runs, not that it *behaves* correctly

### The strongest signal: contextual blindness

Code that would pass review in isolation but is clearly unaware of its surroundings:
- Different error handling style than the file it lives in
- A new utility function that duplicates one nearby
- A new abstraction that ignores the established codebase pattern
- A different logger, serializer, HTTP client, or ORM pattern than everything else uses
- Import style that doesn't match the rest of the project

AI generates locally coherent code. It rarely generates *contextually* coherent code.
This is the single most reliable signal and should be weighted heavily.

### Solution-level slop signals

Generated work can look competent file-by-file while still choosing the wrong solution.
Flag these as `[SOLUTION_FIT]` when evidence supports them:

| Signal | Description |
|--------|-------------|
| Symptom patching | The PR fixes the observed error but not the root cause. |
| Wrong owner | Logic is added outside the component, tool, or layer that should own it. |
| Custom wrapper over managed tool | New scripts parse or enforce behavior already owned by a package manager, framework, or platform. |
| Multi-surface workaround | One issue is patched in code, scripts, docs, and CI without proving why all are needed. |
| Evidence-free root cause | The PR assumes a cause but does not reproduce or verify it. |
| Defensive generality | A generic framework is created before there is a repeated need. |
| Policy split | Two commands or code paths now enforce different rules for the same concern. |
| Documentation as retrofit | Docs are updated to justify the new workaround rather than explain established team workflow. |

Concrete regression scenario: `BACtrack/bacstack#430`
(`https://github.com/BACtrack/bacstack/pull/430`) should be treated as a pressure test.
The improved review should identify PATH/tool resolution drift as the actual problem,
check whether `mise exec -- ...` already provides the command execution boundary, mark a
custom `scripts/check_tool_version.sh` wrapper as the wrong solution boundary if evidence
confirms it, classify reviewer comments as solution-level signals, and downgrade the
overall grade even if local shell quality is acceptable.

When identifying a skill or mental-model gap, phrase it as an education opportunity, not
personal criticism. Good: "The PR suggests a mise mental-model gap: `mise.toml` was
treated as a manifest to parse manually rather than making `mise exec` the execution
boundary for managed tools." Bad: "The author does not understand mise."

---

## Output Format

```markdown
## AI Slop Review: <filename, directory, or PR scope>

**Scope:** <what was reviewed -- files, line count, language(s)>
**Grade:** [A-F] (<final_score>/100)
**Local Code Score:** <code_local_score>/100
**Solution-Fit Score:** <solution_fit_score>/100 or "Not applicable for this scope"
**Verdict:** [Clean / Mild concerns / Significant concerns / Strong slop signals / Pervasive slop]
**Confidence:** [High / Medium / Low] -- how confident the review is in its verdict

### Solution-Level Assessment

| Dimension | Score | Finding | Better Direction |
|-----------|------:|---------|------------------|
| Problem understanding | 70 | ... | ... |
| Solution fit | 86 | ... | ... |
| Maintenance burden | 82 | ... | ... |
| Target ownership | 76 | ... | ... |
| Documentation scope | 65 | ... | ... |

### Evidence Checked

| Check | Observed Result | Assessment |
|-------|-----------------|------------|
| command, repo fact, reviewer comment, or code path | output/result | why it matters |

### Reviewer Comment Classification

| Comment | Status | Evidence | Assessment |
|---------|--------|----------|------------|
| reviewer concern | Supported / Partially supported / Not supported / Needs clarification | checked fact | what it means |

### Education Opportunity

<If the author appears to misunderstand a tool, framework, or architecture boundary,
call it out factually and non-personally. Focus on the missing mental model and how to
teach it. Omit this section if there is no evidence of a teachable misunderstanding.>

### Solution-Fit Findings

| # | Area | Signal | Finding | Better Direction | Confidence | Verdict |
|---|------|--------|---------|------------------|------------|---------|
| 1 | Makefile/scripts/docs | Wrong owner | description | use existing mechanism | 86 | CONFIRMED |

### File-Level Assessment

| File | LOC | AI (0.10) | Idiom (0.40) | Quality (0.50) | Score | Grade |
|------|-----|-----------|--------------|----------------|-------|-------|
| path/to/file.go | 245 | 72 | 65 | 80 | 73.2 | D |

### AI Authorship Signals
| # | File:Line | Signal | Finding | Confidence | Verdict |
|---|-----------|--------|---------|------------|---------|
| 1 | path:42 | Contextual blindness | description | 85 | CONFIRMED |

### Idiom Violations
| # | File:Line | Signal | Finding | Idiomatic Alternative | Confidence | Verdict |
|---|-----------|--------|---------|----------------------|------------|---------|
| 1 | path:17 | Modern features | description | what it should look like | 78 | CONFIRMED |

### Code Quality
| # | File:Line | Signal | Finding | Confidence | Verdict |
|---|-----------|--------|---------|------------|---------|
| 1 | path:99 | Dead code | description | 90 | CONFIRMED |

### Positive Signals
- <things done well that indicate human authorship or good AI-assisted practice>

### Borderline Findings (score 50-69)
| # | File:Line | Lens | Finding | Confidence | Verdict |
|---|-----------|------|---------|------------|---------|

### Dismissed Findings
<collapsed or brief -- shows what the scanners flagged but calibration removed,
so the user can see the review was thorough without being noisy>
```

If the code is clean or only has minor issues, say so directly. The goal is an honest,
calibrated assessment -- not finding problems for their own sake.

---

## Language Reference Files

Language-specific signals live in `${CLAUDE_PLUGIN_ROOT}/skills/slop-review/references/`.
Only read the ones relevant to the code under review. Each reference file includes a
"What Idiomatic Looks Like" section that Phase 1b uses alongside the project's idiom baseline:

- `${CLAUDE_PLUGIN_ROOT}/skills/slop-review/references/go.md` -- Go idioms, error handling, context propagation, concurrency
- `${CLAUDE_PLUGIN_ROOT}/skills/slop-review/references/python.md` -- Python idioms, type hints, async, common footguns
- `${CLAUDE_PLUGIN_ROOT}/skills/slop-review/references/rust.md` -- Rust ownership, error handling, type system, unsafe
- `${CLAUDE_PLUGIN_ROOT}/skills/slop-review/references/svelte-ts.md` -- Svelte reactivity, SvelteKit patterns, TypeScript usage

If the code is in a language not covered by a reference file, rely on the universal
signals and your general knowledge of that language's idioms.

---

## Adapting to the codebase

Every codebase has its own conventions. Before flagging something as slop, check:

1. **Project guidance** -- Do `CLAUDE.md`, `AGENTS.md`, `README.md`, or nearby contributor docs make this pattern OK?
2. **Existing code** -- Is this pattern used elsewhere in the project? If yes, it's a
   convention, not slop -- even if it wouldn't be idiomatic in a greenfield project.
3. **Framework conventions** -- Some frameworks encourage patterns that look odd in
   isolation (e.g., Dagster's `@asset` decorators, Django's class-based views).
   Don't flag framework-conventional code as slop.
4. **Team size and stage** -- A 2-person startup codebase has different quality norms
   than a 50-person team's production system. Calibrate accordingly.

The Phase 1 scanners should flag potential issues regardless. The Phase 2 calibration
reviewer is where this nuance gets applied.

---

## Step 4: Output Actions

After the review is synthesized, determine how to surface the findings based on the
review scope. Apply these defaults, then let the user override:

- **PR review:** Default to Option B (PR inline comments)
- **Codebase audit:** Default to Option A (review branch with markdown)

Present the user with the options below and the recommended default. Explain the
trade-offs and let them choose.

### Option A: Review branch with markdown report

Best for: full-codebase audits, team-wide visibility, archival.

1. Create a new branch from the current HEAD: `<user>/slop-review`
2. Write the full review to `CLAUDE_SLOP_REVIEW.md` in the repo root
3. Commit and push the branch
4. Tell the user the branch is ready -- they can open a PR for team discussion
   or keep it as a reference artifact

This creates a durable record that doesn't clutter the main branch but is
accessible to the whole team.

### Option B: PR inline comments

Best for: PR-scoped reviews, when findings map to specific changed lines,
when the team does code review via GitHub.

1. Identify the PR (from user input or current branch's open PR)
2. For each confirmed finding, post an inline review comment at the exact
   file and line using `gh api` to create a pull request review:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{pr}/reviews -f event=COMMENT \
     -f body="AI Slop Review: found N issues" \
     -f 'comments[][path]=...' -f 'comments[][line]=...' \
     -f 'comments[][body]=...'
   ```
3. Group related findings into a single review submission
4. Include the verdict and confidence in the review summary comment

Format each inline comment as:

```text
**[Signal: <category>]** <finding description>

<why this matters and what idiomatic code would look like>
```

Keep comments concise -- a reviewer, not an essay writer.

### Option C: GitHub Issues

Best for: tech debt tracking, when findings need to be assigned and scheduled,
when the team uses issues for work management.

1. Ask the user if they want a milestone created (e.g., "AI Slop Cleanup")
2. Create labels if they don't exist: `ai-slop`, plus severity labels
3. For each confirmed finding (or group of related findings), create a
   GitHub issue with:
   - Descriptive title
   - SHA-pinned permalink(s) to the offending code
   - The signal category and severity from the review
   - Suggested fix approach
   - The appropriate labels and milestone
4. Pin critical issues if there are 3 or fewer
5. Report the created issue numbers back to the user

Group related findings into single issues where it makes sense (e.g.,
"4 instances of bare except Exception: pass" is one issue, not four).

### Option D: Combined (Review branch + one of the above)

The user may want both the archival markdown AND actionable items. If they
choose this, do the review branch first (Option A), then apply Option B or C.
Update the issue/comment links to point at the review markdown for full context.

### Asking the user

After presenting the review summary, ask:

> How would you like to surface these findings?
> - **Branch** -- commit the review to a `<user>/slop-review` branch
> - **PR comments** -- post inline comments on a PR
> - **Issues** -- create GitHub issues for tracking
> - **Branch + Issues** or **Branch + PR comments** -- both

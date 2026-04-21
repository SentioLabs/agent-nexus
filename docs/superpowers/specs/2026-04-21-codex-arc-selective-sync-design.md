# Codex Arc Selective Sync Design

Date: 2026-04-21

## Summary

Update `codex-marketplace/plugins/arc` by selectively porting the strongest
Claude `arc` improvements that also fit Codex well.

This pass should improve the Codex plugin's shared workflow layer without
flattening Codex-specific packaging, hooks, commands, assets, or evals. The
goal is not raw parity. The goal is a cleaner shared core that makes future
Claude-to-Codex syncs easier, while preserving the Codex-native runtime surface.

## Decision

Gate: APPROVED

Proceed with a selective structural sync:

- port platform-neutral workflow improvements from Claude into the Codex `arc`
  shared-core files
- add the new read-only `arc-spec-reviewer` agent and wire it into the Codex
  implementation flow
- keep Codex-owned plugin packaging and runtime adapters intact unless a change
  is clearly required for the shared workflow to function

## Source Context

Primary files reviewed:

- `claude-marketplace/plugins/arc/agents/arc-implementer.md`
- `claude-marketplace/plugins/arc/agents/arc-spec-reviewer.md`
- `claude-marketplace/plugins/arc/skills/implement/SKILL.md`
- `claude-marketplace/plugins/arc/skills/plan/SKILL.md`
- `claude-marketplace/plugins/arc/skills/review/SKILL.md`
- `claude-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
- `claude-marketplace/plugins/arc/skills/debug/SKILL.md`
- `codex-marketplace/plugins/arc/agents/arc-implementer.md`
- `codex-marketplace/plugins/arc/skills/implement/SKILL.md`
- `codex-marketplace/plugins/arc/skills/plan/SKILL.md`
- `codex-marketplace/plugins/arc/skills/review/SKILL.md`
- `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
- `codex-marketplace/plugins/arc/skills/debug/SKILL.md`
- `codex-marketplace/plugins/arc/.codex-plugin/plugin.json`
- `codex-marketplace/plugins/arc/.claude-plugin/plugin.json`
- `codex-marketplace/plugins/arc/hooks.json`
- `codex-marketplace/plugins/arc/commands/plugin.md`
- `codex-marketplace/plugins/arc/CHANGELOG.md`

## Goals

- Improve the Codex `arc` workflow using proven Claude updates that are runtime
  neutral.
- Reduce future Claude-to-Codex sync friction by keeping the shared workflow
  files structurally aligned where possible.
- Introduce `arc-spec-reviewer` as a useful, low-overhead read-only guardrail
  for exact task compliance.
- Keep Codex-specific plugin packaging, hook behavior, and marketplace metadata
  first-class and truthful.
- Apply `skill-creator` guidance to keep the revised Codex `SKILL.md` files
  lean, triggerable, and portable.

## Non-Goals

- Converting the Codex plugin into a near-clone of the Claude plugin
- Removing Codex-only files such as `.codex-plugin/plugin.json`, `hooks.json`,
  `commands/plugin.md`, or marketplace assets
- Importing Claude-only packaging assumptions or hook behavior unchanged
- Reworking unrelated `arc` features that were not touched by the Claude update
- Expanding scope into general plugin cleanup outside the sync boundary

## Shared-Core Vs Codex-Owned Surface

Treat the Codex `arc` plugin as two layers.

### Shared-Core Workflow Layer

These files should stay as close to Claude as Codex runtime constraints allow:

- `codex-marketplace/plugins/arc/agents/arc-implementer.md`
- `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md`
- `codex-marketplace/plugins/arc/skills/implement/SKILL.md`
- `codex-marketplace/plugins/arc/skills/plan/SKILL.md`
- `codex-marketplace/plugins/arc/skills/review/SKILL.md`
- `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md`
- `codex-marketplace/plugins/arc/skills/debug/SKILL.md`

The sync strategy for these files is "shared wording first, Codex notes only
where necessary." Future syncs should mostly compare this layer against Claude
and either port or intentionally reject deltas.

### Codex-Owned Runtime Layer

These files remain intentionally Codex-specific:

- `codex-marketplace/plugins/arc/.codex-plugin/plugin.json`
- `codex-marketplace/plugins/arc/hooks.json`
- `codex-marketplace/plugins/arc/commands/plugin.md`
- `codex-marketplace/plugins/arc/assets/*`
- `codex-marketplace/plugins/arc/evals/**`

This layer owns Codex packaging, install UX, hooks, assets, and eval wiring.
Claude-driven wording changes should not override this surface unless the shared
workflow requires an explicit runtime adapter update.

## Ported Behavioral Changes

Port the following Claude updates into Codex.

### 1. Planning Hardening

Bring the explicit "No Placeholders" rule into
`codex-marketplace/plugins/arc/skills/plan/SKILL.md`.

The Codex plan skill should reject vague implementation steps such as "add
validation," "handle edge cases," "write tests for the above," or task steps
that mention undefined functions or types without showing the concrete code or
commands the implementer needs.

Also add the plan self-review pass from Claude so the planner checks:

- design coverage
- placeholder content
- type and naming consistency across tasks
- step completeness for code and command steps

This should be ported with wording kept as close to Claude as practical to make
future syncs straightforward.

### 2. Implementer Scope Discipline

Bring Claude's tighter scope-discipline guidance into both:

- `codex-marketplace/plugins/arc/agents/arc-implementer.md`
- `codex-marketplace/plugins/arc/skills/implement/SKILL.md`

Key behavior changes to port:

- build only what the task specifies
- do not add helpers, flags, utilities, or speculative improvements
- do not fill in ambiguous steps with independent judgment
- distinguish missing prerequisites from non-blocking out-of-scope concerns
- explicitly remove extra work discovered during gate review

Codex should adopt Claude's richer result model:

- `PASS`
- `PARTIAL`
- `NEEDS_CONTEXT`
- `DONE_WITH_CONCERNS`

The implement skill should triage these result states directly instead of
forcing ambiguity and scope problems into a generic `PARTIAL` bucket.

### 3. Review Behavior By Evaluator Presence

Update `codex-marketplace/plugins/arc/skills/review/SKILL.md` so the reviewer
behavior depends on whether an evaluator is active.

When evaluator status is `active`, the reviewer should focus on code quality,
conventions, structure, and plan adherence while deferring behavioral
verification to the evaluator.

When evaluator status is `not dispatched`, the reviewer should still stay
read-only, but it must flag suspected behavioral mismatches or edge-case gaps
it can see in the code so the orchestrator can decide whether to escalate.

The dispatch prompt and triage language should mirror Claude's updated wording
as closely as Codex allows.

### 4. Small Compatible Wording Refreshes

Port only small, clearly compatible wording changes from the Claude
`brainstorm` and `debug` skills where they improve clarity without changing the
Codex-specific workflow contract.

This is a cleanup pass, not a redesign of those skills. Keep Codex-native
workflow behavior in place.

## New Agent: Arc Spec Reviewer

Add `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md` using the
Claude agent as the baseline.

This agent is read-only and has one narrow job: verify exact task compliance.

It should check:

- missing required work from `## Steps`
- extra work outside the task scope
- misunderstandings of the task intent
- whether the implementation tests align with the task's expected outcomes

It should not duplicate the evaluator's behavior testing or the reviewer's code
quality pass.

## Codex Wiring For Reviewer, Spec Reviewer, And Evaluator

Update `codex-marketplace/plugins/arc/skills/implement/SKILL.md` so post-build
verification uses three complementary checks for normal implementation tasks:

- `arc-reviewer` for code quality and plan adherence
- `arc-spec-reviewer` for exact task compliance and scope-boundary checking
- `arc-evaluator` for adversarial spec-intent verification through independent
  testing

### Dispatch Model

After the implementer returns a passing result and the orchestrator re-runs the
project test command successfully:

- dispatch reviewer, spec reviewer, and evaluator in parallel for normal code
  tasks
- skip the evaluator for `docs-only` tasks
- use reviewer and spec reviewer for `docs-only` tasks only when the task
  changes developer-facing workflow docs, command docs, or other documentation
  that materially affects how `arc` is used

### Triage Model

Treat the three outputs as complementary:

- evaluator findings take priority on behavioral correctness
- spec reviewer findings take priority on missing or extra scoped work
- reviewer findings govern code quality, conventions, and plan adherence

If two checks disagree, resolve in this order:

1. evaluator for spec-intent behavior
2. spec reviewer for exact task compliance
3. reviewer for quality and conventions

This ordering matches the intended responsibilities and prevents duplicate
authority.

## Skill-Creator Guardrails

Use the `skill-creator` skill as a review rubric for the updated Codex
`SKILL.md` files.

Apply it to the revised `plan`, `implement`, `review`, and any touched
`brainstorm` or `debug` skill files.

The guardrails are:

- **Frontmatter quality**: descriptions must clearly say when the skill should
  trigger in Codex.
- **Concise shared-core wording**: keep the portable workflow rules in
  `SKILL.md`, but do not bloat the files with packaging detail.
- **Progressive disclosure**: place runtime- or marketplace-specific details in
  Codex-owned docs or manifests instead of overloading the skills.

The intent is not to rewrite the arc skills from scratch. The intent is to make
sure the synced skill files remain good Codex skills after the Claude wording is
ported.

## Expected File Changes

Expected changes in this implementation pass:

- modify `codex-marketplace/plugins/arc/agents/arc-implementer.md`
- add `codex-marketplace/plugins/arc/agents/arc-spec-reviewer.md`
- modify `codex-marketplace/plugins/arc/skills/implement/SKILL.md`
- modify `codex-marketplace/plugins/arc/skills/plan/SKILL.md`
- modify `codex-marketplace/plugins/arc/skills/review/SKILL.md`
- modify `codex-marketplace/plugins/arc/skills/brainstorm/SKILL.md` only if the
  Claude comparison shows a clear wording improvement that does not alter the
  Codex workflow contract
- modify `codex-marketplace/plugins/arc/skills/debug/SKILL.md` only if the
  Claude comparison shows a clear wording improvement that does not alter the
  Codex workflow contract
- update `codex-marketplace/plugins/arc/CHANGELOG.md`
- update `codex-marketplace/plugins/arc/version.txt` if the shipped plugin
  version changes in the same pass

Files that should remain intentionally Codex-specific unless a concrete need
emerges:

- `codex-marketplace/plugins/arc/.codex-plugin/plugin.json`
- `codex-marketplace/plugins/arc/hooks.json`
- `codex-marketplace/plugins/arc/commands/plugin.md`
- `codex-marketplace/plugins/arc/evals/**`
- `codex-marketplace/plugins/arc/assets/*`

## Verification

This implementation pass should verify two levels of correctness.

### 1. Shared-Core Sync Verification

Confirm that the intended Claude improvements landed in the Codex shared-core
files and that any deliberate deviations are explicit and small.

Suggested checks:

- targeted diffs between Claude and Codex shared-core files
- inspection that Codex-only files remained intentionally distinct
- verification that the spec reviewer is wired into the implement flow exactly
  where the design expects

### 2. Skill And Plugin Hygiene

Confirm that the revised Codex skills still read like strong Codex skills and
that shipped metadata stays coherent.

Suggested checks:

- frontmatter and trigger wording review using the `skill-creator` rubric
- changelog entry that describes the Codex-specific shipped change clearly
- version bump only if the plugin release surface actually changed

## Risks And Boundaries

The main risk is accidental over-sync: importing Claude-shaped assumptions into
Codex-owned files or creating duplicated review responsibilities that confuse
the orchestrator.

Mitigations:

- keep the shared-core vs Codex-owned split explicit
- keep the spec reviewer narrow and read-only
- avoid changing Codex packaging or hook behavior unless a concrete wiring need
  appears during implementation

## Recommended Next Step

Write an implementation plan that breaks this sync into concrete file-level
tasks, with the spec reviewer integration and skill wording changes called out
explicitly.

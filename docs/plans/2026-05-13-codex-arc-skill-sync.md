<!-- arc-review: kind=legacy id=plan.06okqt -->
# Codex Arc Skill Sync

## Goal

Update `codex-marketplace/plugins/arc` from the newer Claude arc workflow docs while keeping Codex-specific runtime semantics.

The Claude-side changes are intentional arc vocabulary updates, not just Claude implementation detail. The Codex plugin should use the same user-facing arc names where the concepts are shared:

- `build` skill instead of `implement`
- `builder` agent instead of `arc-implementer`
- `issue-manager` agent instead of `arc-issue-tracker`
- `code-reviewer`, `spec-reviewer`, `doc-writer`, and `evaluator` instead of `arc-*` prefixed names

Codex-specific mechanics still stay Codex-specific:

- Use Codex subagent language and examples instead of Claude `Agent` / team primitives when the workflow is executable in Codex.
- Use `request_user_input` when available, otherwise ask a concise plain-text question and wait, instead of naming Claude's `AskUserQuestion` tool as a hard requirement.
- Refer to `AGENTS.md` for project instructions and opt-outs; mention `CLAUDE.md` only as an additional compatibility file when relevant.

## Scope

### Update Skill Vocabulary

Rename the Codex implementation skill from `skills/implement/` to `skills/build/` and update the skill frontmatter to `name: build`.

Update all Codex arc docs that reference `implement` as a workflow skill to use `build`:

- `skills/arc/SKILL.md`
- `skills/brainstorm/SKILL.md`
- `skills/plan/SKILL.md`
- `skills/debug/SKILL.md`
- `skills/verify/SKILL.md`
- `skills/review/SKILL.md`
- the renamed `skills/build/SKILL.md`
- command docs and changelog entries where current wording would confuse users

Keep ordinary English uses of "implement" when describing the act of writing code.

### Rename Agents

Rename Codex agent files to match the Claude canonical names:

- `agents/arc-implementer.md` -> `agents/builder.md`
- `agents/arc-issue-tracker.md` -> `agents/issue-manager.md`
- `agents/arc-reviewer.md` -> `agents/code-reviewer.md`
- `agents/arc-spec-reviewer.md` -> `agents/spec-reviewer.md`
- `agents/arc-doc-writer.md` -> `agents/doc-writer.md`
- `agents/arc-evaluator.md` -> `agents/evaluator.md`

Update all references to those agent names in skills and docs.

### Port General Arc Reference Updates

Update `skills/arc/SKILL.md` with Codex-specific versions of the new Claude content:

- Add `arc share` to the CLI reference.
- Replace the legacy-only `Plans` section with a `Design Reviews` section that documents `legacy`, `share-local`, and `share-remote` surfaces.
- Add the line-1 review marker contract: `<!-- arc-review: kind=<legacy|share-local|share-remote> id=<id> -->`.
- Add stacked PR guidance and include a Codex `STACKING.md` playbook adapted from Claude's version.
- Keep Codex caveats for team deployment because `arc team-deploy` is still Claude-first in the current Codex plugin.

### Port Brainstorm Updates

Update `skills/brainstorm/SKILL.md` with Codex-specific versions of:

- Protected-branch pre-flight check.
- Scope decomposition check before detailed questions.
- Foreclosed-questions handling.
- Capability-aware approach comparison using Codex terms: stronger model / higher reasoning effort / more review cycles, not Claude model names.
- Design-for-isolation guidance.
- New `5.5. Grill the Design` loop before publishing the plan.
- Review surface selection via `arc plan` or `arc share`.
- Marker write/update rules.
- Review loop routing by marker kind.
- Routing analysis that recommends `/arc:plan` or `/arc:build`.

### Add Protected Branch Check

Add `skills/arc/_branch-check.md` adapted for Codex:

- Check current branch.
- Treat `main`, `master`, `release`, and `production` as protected.
- Look for an explicit opt-out in `AGENTS.md` or `CLAUDE.md`.
- If on a protected branch, ask whether to create a feature branch, stay, or cancel.
- Use Codex input semantics, not Claude `AskUserQuestion`.
- In brainstorm, run this before design dialogue.
- In build, run it before dispatching work.
- In finish, run it before staging/committing.

### Update Plan Review Routing

Update `skills/plan/SKILL.md` to read the review marker before invoking review commands:

- `legacy` uses `arc plan show/comments/approve`.
- `share-local` and `share-remote` use `arc share show/comments/pull/approve/update`.
- Unmarked docs may fall back to reading the file directly, with a warning that review-state CLI routing is unavailable.

The plan skill should continue to create tasks through the renamed `issue-manager` agent and produce `/arc:build` handoff prompts.

## Out Of Scope

- Do not make `arc team-deploy` fully Codex-native in this pass.
- Do not add a Codex git-spice plugin.
- Do not change the arc CLI itself.
- Do not migrate old already-created plan files.

## Verification

- `rg` finds no stale workflow references like `/arc:implement`, `skills/implement`, `arc-implementer`, `arc-issue-tracker`, `arc-reviewer`, `arc-spec-reviewer`, `arc-doc-writer`, or `arc-evaluator` in `codex-marketplace/plugins/arc`.
- `rg` confirms the new canonical names appear where expected.
- `find codex-marketplace/plugins/arc/skills -maxdepth 2 -name SKILL.md` shows `skills/build/SKILL.md` and no `skills/implement/SKILL.md`.
- `find codex-marketplace/plugins/arc/agents -maxdepth 1 -type f` shows the unprefixed agent filenames.
- Review changed markdown for Codex-only tool names and remove hard Claude-only instructions except where explicitly describing Claude-first team deployment.

## Routing Analysis

Work items: 4 tasks

Parallel readiness: No shared code contracts. The work is documentation and file-renaming only, but references are cross-cutting.

Files touched: Approximately 15-20 markdown files across `skills/`, `agents/`, command docs, and changelog.

Layers crossed: Codex plugin skills, Codex plugin agents, command docs, workflow docs.

Risk areas: Naming drift and broken references after renaming skill/agent files.

Scale: Medium.

Recommendation: `/arc:plan`

Reason: Multiple files and cross-references need a deliberate task breakdown, even though no runtime code changes are expected.

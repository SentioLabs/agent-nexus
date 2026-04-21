---
name: arc-plan
description: Use when an approved Arc design needs to be converted into truthful tracked work before implementation starts. Prefer this over generic planning when the project uses Arc plans and issue tracking.
---

# Arc Plan

Turn an approved Arc design into ordered tracked work and hand off to `arc-implement` only after the work exists.

<HARD-GATE>
Do NOT implement, scaffold implementation files, or bypass tracked work creation while planning. This skill owns issue creation and ends before implementation starts.
</HARD-GATE>

## Ordered Checklist

Follow these items in order.

1. **Read the approved design**
   - Run `arc plan show <plan-id>`.
   - Read the approved design, plan status, and file path from the planner output before creating tasks.
   - Verify that the plan status is approved before proceeding.
   - If the plan is deferred, pending review, or otherwise not approved, stop and direct the user back to planner review instead of creating tracked work.
2. **Restate the approved goal and constraints**
   - Restate the approved goal, scope boundaries, major risks, and non-goals in plain language.
   - Preserve any shared contracts, foundation work, or dependency ordering established during `arc-brainstorm`.
   - Ask one clarifying question only if something material is still ambiguous.
3. **Break the design into ordered tasks**
   - Create a truthful, bounded task list from the approved design.
   - Keep tasks dependency-ordered.
   - Use exact file ownership when it is honestly knowable.
   - If exact files are not yet knowable, name the owning subsystem, contract boundary, or surface instead of pretending certainty.
   - If shared contracts or setup must land first, create an explicit foundation task and order downstream work behind it.
4. **Keep the task list realistic**
   - Do not invent placeholder work, vague cleanup tasks, or hidden phases.
   - Do not expand scope beyond the approved design.
   - Keep the breakdown small enough that each item represents a real unit of tracked work.
5. **Create tracked work through `arc-issue-tracker`**
   - Use `arc-issue-tracker` to create the tracked work.
   - Do not create ad hoc issues in `arc-brainstorm` or `arc-implement`.
   - Create either a single tracked issue for small work or an epic plus child issues for multi-task work.
   - Preserve dependency ordering and ownership in the tracked work that gets created.
   - Hand the agent a manifest that includes the approved plan ID, the plan file path from `arc plan show <plan-id>`, the chosen tracked-work shape, the ordered task list, ownership notes, and dependency notes.
   - Require the agent to return the created Arc IDs, titles, parent-child relationships when applicable, and dependency results so the main session can verify them.
6. **Confirm tracked work exists**
   - Verify the issue creation result from `arc-issue-tracker` before moving on.
   - Check that the returned IDs match the requested tracked-work shape: one issue for the small-work path, or one epic plus the expected child issues for the multi-task path.
   - Spot-check that parent-child relationships and dependency ordering were created when requested.
   - Make sure the resulting tracked work matches the approved design and ordered task list.
7. **Ask for approval before implementation starts**
    - Present the tracked work summary and execution order.
    - Ask for approval before handing off to implementation.
    - If the user changes scope or ordering before approval but the requested changes stay within the approved design, revise the task list and reconcile the already-created tracked work before asking again.
    - Reconciliation can mean updating issue descriptions, titles, dependencies, or parentage when the existing IDs still fit, or creating replacement tracked work for items that changed materially within the already approved design.
    - If the requested change materially expands or changes the approved design, stop and send the user back to planner review instead of mutating tracked work in place.
    - Re-verify the reconciled tracked work after those changes before asking for approval again.
    - Keep the final approval tied to the actual tracked work that now exists, not the stale pre-change version.
8. **Hand off only after tracked work exists**
   - Route to `arc-implement` only after the tracked work has been created.
   - Do not begin implementation inside this skill.

## Planning Rules

- Start from `arc plan show <plan-id>`.
- Require `arc plan show <plan-id>` to report an approved plan before creating tracked work.
- Restate the approved goal and constraints before writing tasks.
- Preserve shared contracts and dependency ordering from brainstorm.
- Keep the task list truthful and bounded.
- Use exact file ownership when honestly knowable.
- Create tracked work through `arc-issue-tracker`.
- Support a single issue when the approved design is genuinely small.
- Make the tracked-work shape explicit: single issue for small work, or epic plus child issues for multi-task work.
- Do not absorb material design changes after issue creation; route those back to planner review.
- Ask for approval before implementation starts.
- Do not implement while planning.

## Tracked Work Standard

The planning output should be Arc-ready tracked work, not a generic outline.

- Create an epic plus child issues when the design spans multiple work items.
- Create a single tracked issue when the design is small enough that extra issue splitting would be fake precision.
- Give `arc-issue-tracker` a manifest with the plan reference, task order, ownership, and dependency expectations.
- Verify the returned Arc IDs, shape, and dependencies before asking for approval.
- Keep dependencies explicit.
- Keep ownership explicit.
- Keep the breakdown aligned to the approved design instead of adding speculative follow-up work.

## Completion Condition

This skill is complete when:

- `arc plan show <plan-id>` has been used to read the approved design,
- `arc plan show <plan-id>` has confirmed the plan is approved,
- the approved goal and constraints have been restated,
- shared contracts and dependency ordering from brainstorm have been preserved,
- one or more tracked issues have been created through `arc-issue-tracker`,
- the user has approved the tracked work before implementation, and
- the handoff goes to `arc-implement` only after tracked work exists.

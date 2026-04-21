---
name: arc-brainstorm
description: Use when starting Arc-tracked design exploration, feature discovery, architecture decisions, or trade-off analysis before implementation. Prefer this over generic brainstorming when the project uses Arc plans and issue tracking.
---

# Arc Brainstorm

Turn an idea into an approved design artifact, register it with the Arc planner, and hand it off to `arc-plan`.

<HARD-GATE>
Do NOT write implementation code, scaffold files beyond the design document, invoke `arc-implement`, or begin execution during brainstorming. This skill ends with either an approved design in the planner and a handoff to `arc-plan`, or a saved design that is deferred for later.
</HARD-GATE>

## Ordered Checklist

Follow these items in order.

1. **Explore current project context**
   - Check the relevant files, docs, recent changes, and existing Arc issue or plan context before proposing changes.
   - Understand what already exists, what constraints are already fixed, and which project patterns should be preserved.
2. **Run a one-question design loop**
   - Ask one clarifying question at a time.
   - Prefer native OpenCode multiple-choice questions when practical.
   - Use open-ended questions only when bounded options would hide an important unknown.
   - Do not dump a batch of questions in one message.
3. **Propose bounded approaches**
   - Present 2-3 realistic approaches with trade-offs, expected complexity, and a recommendation.
   - Ask the user to approve the recommendation or choose another approach before continuing.
4. **Present the design in approved sections**
   - Build the design in clear sections such as goal, scope boundaries, chosen approach, interfaces or contracts, dependency ordering, testing expectations, and risks.
   - Present one section at a time when the design is non-trivial.
   - Ask for approval at each major design checkpoint before moving forward.
   - If the user requests changes, revise that section and ask again.
5. **Prepare the approved design artifact**
   - Once the design is approved in-session, write it to `docs/plans/YYYY-MM-DD-<topic>.md`.
   - Keep the document concise, decision-oriented, and ready for planner review.
   - Include the approved goal, in-scope work, out-of-scope work, chosen approach, shared contracts, dependency notes, testing expectations, and major risks.
6. **Register the design with Arc planner**
    - Run `arc plan create <path>` using the design file path.
    - Capture the returned plan ID and planner URL from the command output when available.
    - If the command output does not print the planner URL directly, derive it in this order: `ARC_SERVER` from the environment, then the Arc server URL from local config.
    - If no authoritative server URL is available, do not invent one; surface the `plan-id` explicitly and tell the user the planner URL could not be derived automatically.
    - Surface both the `plan-id` and planner URL explicitly whenever the URL is available so the user can open or resume the review state directly.
7. **Run the planner review loop with a native OpenCode question**
   - Ask a native OpenCode question with only these outcomes:
     - `approve the design`
     - `feedback submitted in planner`
     - `save for later`
   - Do not render a plain-text approval menu.
   - Include the planner URL directly in the prompt text.
8. **Handle planner feedback truthfully**
   - If the user selects `feedback submitted in planner`, run `arc plan comments <plan-id>` and `arc plan show <plan-id>`.
   - Read the planner feedback, revise the same design file, and repeat the same planner review loop.
   - Continue until the design is approved or deferred.
9. **Approve and hand off**
   - If the user selects `approve the design`, run `arc plan approve <plan-id>`.
   - Always hand off to `arc-plan` after approval.
   - Never offer direct `arc-implement` routing from `arc-brainstorm`, even for tiny tasks.
10. **Defer cleanly when needed**
   - If the user selects `save for later`, stop after confirming the design file path, `plan-id`, and planner URL.
   - Do not begin planning or implementation.

## Interaction Rules

- Ask one question at a time.
- Prefer native OpenCode multiple-choice questions when practical.
- Present 2-3 approaches before locking the design.
- Ask for approval at each major design checkpoint.
- Avoid bulk question dumps.
- Avoid plain-text approval menus.
- Do not begin implementation.

## Design Artifact Requirements

The approved design artifact should be ready for `arc-plan` without re-inventing the design.

- Include the approved goal and success criteria.
- Include scope boundaries and explicit non-goals.
- Include the chosen approach and why it won.
- Include shared contracts or interfaces when later tasks depend on them.
- Include dependency ordering or foundation-first sequencing when needed.
- Include testing expectations and major risks.
- Keep the design truthful and bounded to what the user actually approved.

## Planner Review Loop

Follow the review loop already defined in the ordered checklist.

- Surface both the `plan-id` and planner URL as the review state.
- If the planner URL cannot be derived from command output, `ARC_SERVER`, or local Arc config, say so explicitly instead of fabricating a link.
- Reuse the same native OpenCode question until the design is approved or deferred.
- On approval, run `arc plan approve <plan-id>` and route to `arc-plan`.

## Completion Condition

This skill is complete when:

- the design has been explored and approved in sections,
- the approved design has been written to `docs/plans/`,
- the design has been registered with `arc plan create`,
- the `plan-id` and planner URL have been surfaced explicitly,
- the planner review loop has ended in approval or deferral, and
- approved work is handed off to `arc-plan`, while deferred work stops cleanly without planning or implementation.

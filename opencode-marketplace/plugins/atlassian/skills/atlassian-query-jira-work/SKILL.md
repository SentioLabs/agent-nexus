---
name: atlassian-query-jira-work
description: "Query Jira work items by assignee, active sprint, and board-aware natural language. Use when an agent needs to: (1) find personal Jira tickets, (2) interpret active sprint requests on a named board, (3) distinguish open vs all assigned work, or (4) translate board-based sprint questions into resolved sprint-ID JQL. Follows the shared board/sprint resolution concepts used by the Atlassian plugin."
---

# Query Jira Work

## Keywords
my tickets, my issues, active sprint, current sprint, assigned work, board, sprint, what's on my sprint, open issues, all tickets, my Jira work

Use this skill when the user wants their assigned Jira work for a sprint, especially when they mention a board by name and expect the plugin to resolve the board first, then query the active sprint on that board.

This skill follows the shared resolver concepts in [board-sprint-resolution.md](./references/board-sprint-resolution.md) instead of inventing a second board model.

## Workflow

Follow this sequence:

1. Identify whether the user wants open work or all work.
2. Extract the board name from the request if one is mentioned.
3. Resolve the board dynamically by name.
4. Resolve the active sprint for that board.
5. Build JQL using the resolved sprint ID.
6. Query Jira issues.
7. Summarize the results with the resolved board and sprint context.

## Intent Rules

Default interpretation:

- "my tickets" means `assignee = currentUser()`
- "active sprint" means resolve the active sprint for the resolved board
- "tickets" means `statusCategory != Done` unless the user explicitly asks for all tickets

If the user says "all" or "show everything", keep done items in the result set.

## Why Board Resolution Happens First

Jira does not reliably expose board name as a direct JQL field. The board is a routing concept, not the final filter. Resolve the board by API first, then use the active sprint ID in JQL.

That keeps the query stable, avoids guessing, and matches the shared resolver model documented in [board-sprint-resolution.md](./references/board-sprint-resolution.md).

## Board Matching

When the request includes a board name:

- normalize the input to lowercase
- trim whitespace
- remove a trailing `board`
- prefer exact matches
- then prefix matches
- then substring matches
- ask the user to disambiguate if more than one plausible board remains

## Sprint Resolution

After the board is resolved:

- if there is exactly one active sprint, continue
- if there are no active sprints, report that clearly
- if there are multiple active sprints, ask the user to choose

## JQL Templates

Use the resolved sprint ID, not the board name.

```jql
assignee = currentUser() AND sprint = <activeSprintId> AND statusCategory != Done ORDER BY Rank ASC
```

```jql
assignee = currentUser() AND sprint = <activeSprintId> ORDER BY Rank ASC
```

## Response Shape

When summarizing, include:

- resolved board name
- resolved sprint name and ID
- whether the query returned open work or all work
- the key list of issue keys and summaries

If no issues are found, say that the user has no matching assigned work in the active sprint.

## Examples

- `show me my tickets for the active sprint on the BT board`
- `what issues do I have in the current sprint on the mobile board`
- `show all my tickets for the active sprint on the platform board`

Those examples illustrate the resolution pattern only. They are not special cases.

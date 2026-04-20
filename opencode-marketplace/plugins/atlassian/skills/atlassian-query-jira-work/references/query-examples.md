# Query Jira Work Examples

This reference shows how the `atlassian-query-jira-work` skill should interpret board-aware sprint requests using the shared resolver flow from [board-sprint-resolution.md](./board-sprint-resolution.md).

## Example 1: Open tickets in active sprint for a named board

User request:

```text
show me my tickets for the active sprint on the BT board
```

Resolution:

- treat "my tickets" as `assignee = currentUser()`
- resolve `BT` as the board name
- resolve that board's active sprint
- run JQL with the sprint ID and `statusCategory != Done`

## Example 2: All tickets in active sprint for a named board

User request:

```text
show all my tickets for the active sprint on the platform board
```

Resolution:

- keep all assigned work, including done items
- resolve the board by name
- resolve the board's active sprint
- run JQL using the sprint ID without the `statusCategory != Done` filter

## Example 3: Board disambiguation

User request:

```text
show me my tickets for the active sprint on the support board
```

Resolution:

- search for boards named `support`
- if multiple boards match, ask the user to choose
- do not guess when more than one board is plausible

## Example 4: No active sprint

User request:

```text
what issues do I have in the current sprint on the mobile board
```

Resolution:

- resolve the board by name
- check for an active sprint on that board
- if none exists, report that the board currently has no active sprint
- do not fabricate a sprint or fall back to a different board

## Example 5: Illustrative runtime translation

User request:

```text
show me my tickets for the active sprint on the Example board
```

Runtime translation:

- resolve board name at runtime
- resolve active sprint ID at runtime
- build JQL like:

```jql
assignee = currentUser() AND sprint = <activeSprintId> AND statusCategory != Done ORDER BY Rank ASC
```

This is illustrative only. The actual board name and sprint ID come from Jira at runtime.

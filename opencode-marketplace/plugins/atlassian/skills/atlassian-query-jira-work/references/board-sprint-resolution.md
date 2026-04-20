# Board Sprint Resolution

## Goal

Support natural-language requests like `show me my tickets for the active sprint on the <board name> board` while keeping the behavior general-purpose and avoiding any hardcoded board IDs.

## Default Interpretation

```text
"my tickets" => assignee = currentUser()
"active sprint" => resolve active sprint for the resolved board
"tickets" => default to statusCategory != Done unless the user explicitly asks for all tickets
```

## Resolution Flow

```text
parse board-oriented intent
resolve board by name
resolve active sprint for that board
build JQL using sprint ID
run JQL and return resolution context
```

## Board Matching

- lowercase input
- trim whitespace
- remove trailing `board`
- exact match first
- prefix match second
- substring match last
- ask the user to disambiguate when multiple plausible matches remain

## Sprint Resolution Outcomes

- exactly one active sprint => continue
- zero active sprints => report none
- multiple active sprints => ask the user to choose

## Canonical JQL Templates

```jql
assignee = currentUser() AND sprint = <activeSprintId> AND statusCategory != Done ORDER BY Rank ASC
```

```jql
assignee = currentUser() AND sprint = <activeSprintId> ORDER BY Rank ASC
```

## Failure Modes

- no matching board
- ambiguous board matches
- no active sprint
- zero assigned issues in the active sprint

## Example Resolution

Example:

- User request: `show me my tickets for the active sprint on the Example board`
- Resolved board name: `Example`
- Resolved sprint ID: `12345`
- Final JQL:

```jql
assignee = currentUser() AND sprint = 12345 AND statusCategory != Done ORDER BY Rank ASC
```

This is illustrative only. The board name and sprint ID are resolved at runtime and must not be treated as canonical values.

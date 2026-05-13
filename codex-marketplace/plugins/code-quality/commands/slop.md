---
description: Run a slop review on files, directories, PRs, or the full codebase to detect low-quality AI-generated code, idiom drift, quality issues, and architecture/solution-fit problems
---

# Slop Review

Run the `slop-review` skill against the specified target.

## Usage

- `/code-quality:slop` -- review unstaged changes (default)
- `/code-quality:slop src/` -- review a directory
- `/code-quality:slop path/to/file.go` -- review specific files
- `/code-quality:slop PR` or `/code-quality:slop #123` -- review a pull request

## Instructions

Invoke the `slop-review` skill with the user's specified scope. If no scope is given,
default to reviewing the current git diff (unstaged changes). Pass any arguments the user
provided as the scope for the review.

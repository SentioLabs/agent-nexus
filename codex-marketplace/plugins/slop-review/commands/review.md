---
description: Run an AI slop review on files, directories, PRs, or the full codebase to detect low-quality AI-generated code
---

# AI Slop Review

Run the `ai-slop-review` skill against the specified target.

## Usage

- `/slop-review:review` -- review unstaged changes (default)
- `/slop-review:review src/` -- review a directory
- `/slop-review:review path/to/file.go` -- review specific files
- `/slop-review:review PR` or `/slop-review:review #123` -- review a pull request

## Instructions

Invoke the `ai-slop-review` skill with the user's specified scope. If no scope is given,
default to reviewing the current git diff (unstaged changes). Pass any arguments the user
provided as the scope for the review.

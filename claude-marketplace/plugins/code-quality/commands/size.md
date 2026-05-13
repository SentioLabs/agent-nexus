---
description: Run a PR/branch size review to decide if the change should be split into multiple PRs (preferring git-spice stacked CRs), with effort rating and a concrete stack plan
---

# Size Review

Run the `size-review` skill against the specified target.

## Usage

- `/code-quality:size` -- review the current branch against its base
- `/code-quality:size PR` or `/code-quality:size #123` -- review a pull request
- `/code-quality:size <branch-name>` -- review a specific local branch
- `/code-quality:size <scope> --exclude <pattern>` -- review the scope while
  treating the pattern as a CLI-supplied exclusion for size calculations

## Instructions

Invoke the `size-review` skill with the user's specified scope. If no scope
is given, default to the current branch against its merge-base with the
trunk (`origin/main` or whatever the project's trunk is). Pass any arguments
the user provided as the scope for the review.

If the invocation includes `--exclude <pattern>`, pass the pattern to the
`size-review` skill as a CLI-supplied exclusion. CLI-supplied exclusions augment
the bundled defaults, repo-local `.code-quality/size-review-exclude`, and
`.gitattributes` generated-file exclusions. Quote patterns containing spaces in
the invocation so the pattern boundary is unambiguous.

# Installing Agent Nexus OpenCode Plugins

Use these instructions to install Agent Nexus plugins either into the current project's local
`.opencode/` directory or into the user's global OpenCode config under
`~/.config/opencode/`.

## Quick Start

### Test locally in this repo

Tell OpenCode:

```text
Read and follow .opencode/INSTALL.md, choose the local project install target, and install slop-review.
```

This is the easiest way to verify that the install doc is actionable before relying on the
raw GitHub URL flow.

### Test the public entrypoint after pushing

Tell OpenCode:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/.opencode/INSTALL.md, choose the global install target, and install slop-review.
```

### Clean test recommended

If you do not want to install the files into this repository while testing, run the same
prompt in a scratch repo or temp directory instead.

## Supported Plugins

- `slop-review`: installs the `ai-slop-review` skill and the `/slop-review-review`
  command
- `worktrunk`: installs the `worktrunk` skill and its reference docs
- `atlassian`: installs the Atlassian skills and merges the Atlassian MCP server into
  `opencode.json`
- `mneme`: installs the local runtime plugin, `mneme` skill, and `/mneme-*` commands

## Install Behavior

1. If the user already named one or more plugins, use that selection.
2. If the user did not specify an install target, ask whether to install locally into
   `.opencode/` or globally into `~/.config/opencode/`.
3. If they did not name plugins, ask whether to install `all` or a comma-separated list.
4. Normalize `all` to every currently supported plugin.
5. If a target file already exists and the contents differ, show the conflict and ask before
   overwriting it.
6. If a selected plugin includes files under `plugins/`, copy only those plugin runtime files
   into `.opencode/plugins/` or `~/.config/opencode/plugins/` using the same filename.
   Preserve the filename only; do not preserve nested relative paths under a plugin's
   `plugins/` directory.
7. If a selected plugin includes `opencode.fragment.json`, merge only its top-level
   `opencode` object into the target `opencode.json` file.
8. If the target `opencode.json` file does not exist, create it from the fragment content.
9. Never silently overwrite conflicting `opencode.json` keys; show the conflict and ask
   first.

## Install Targets

- `local`: install into the current project's `.opencode/`
- `global`: install into `~/.config/opencode/`

Use these target roots:

- Local target root: `.opencode/`
- Global target root: `~/.config/opencode/`

## Agent Procedure

Follow these steps exactly:

1. Resolve the plugin selection.
2. Resolve the install target.
3. Create any missing directories under the selected target root.
4. For each selected plugin, copy the source file contents into the mapped target file paths.
5. Preserve file contents exactly; do not rewrite or adapt them during installation.
6. If a target file already exists with different contents, stop and ask whether to overwrite it.
7. For each selected plugin, if files exist under `plugins/`, copy them into
   `plugins/<filename>` under the selected target root. Preserve only the basename; nested
   subdirectories under `plugins/` are not part of the current install contract.
8. For each selected plugin, if `opencode.fragment.json` exists, merge only its top-level
   `opencode` object into `<target root>/opencode.json`.
9. For `opencode.fragment.json` merges, reject any fragment that contains top-level keys other
   than `opencode`.
10. Merge objects recursively by key.
11. Treat arrays as replace-in-full values, not element-by-element merges.
12. Treat scalar values (`string`, `number`, `boolean`, and `null`) as leaf values.
13. Detect conflicts at the leaf key path level. A conflict means both existing and incoming
    values define the same key path but differ after applying the object/array/scalar rules.
14. On any `opencode.json` conflict, stop, show the conflicting key path and both values, and
    ask whether to overwrite that path.
15. After all file copies and merges are complete, verify that every expected file exists.
16. Summarize what was installed, where it was installed, and which skills or commands are now available.

For a local test inside this repository, read from the local source files under
`opencode-marketplace/plugins/` instead of fetching raw GitHub URLs.

For a remote install, fetch from the raw GitHub URLs listed below.

## Available Selections

- `all`
- `slop-review`
- `worktrunk`
- `atlassian`
- `mneme`

## Config Fragment Contract

When a plugin ships `opencode.fragment.json`, it must use this shape:

```json
{
  "opencode": {
    "mcp": {
      "atlassian": {
        "type": "remote",
        "url": "https://mcp.atlassian.com/v1/mcp",
        "enabled": true
      }
    }
  }
}
```

Merge contract:

- `opencode.fragment.json` may contain only one top-level key: `opencode`
- Merge the fragment into `opencode.json` by recursively merging objects
- Replace arrays as whole values; do not merge array elements by index
- Compare conflicts at the leaf key path level after applying the object/array rules
- If the existing and incoming values at the same leaf path differ, stop and ask before
  overwriting that path
- If the same leaf path already has the same value, keep it without prompting

## File Mapping

### slop-review

Source plugin root:

- Local: `opencode-marketplace/plugins/slop-review/`
- Remote: `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/`

Create these relative paths under the selected target root:

- `commands/slop-review-review.md`
- `skills/ai-slop-review/SKILL.md`
- `skills/ai-slop-review/references/go.md`
- `skills/ai-slop-review/references/python.md`
- `skills/ai-slop-review/references/rust.md`
- `skills/ai-slop-review/references/svelte-ts.md`

Fetch them from:

- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/commands/slop-review-review.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/skills/ai-slop-review/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/go.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/python.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/rust.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/svelte-ts.md`

When installing locally from this repo, use these source paths instead:

- `opencode-marketplace/plugins/slop-review/commands/slop-review-review.md`
- `opencode-marketplace/plugins/slop-review/skills/ai-slop-review/SKILL.md`
- `opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/go.md`
- `opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/python.md`
- `opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/rust.md`
- `opencode-marketplace/plugins/slop-review/skills/ai-slop-review/references/svelte-ts.md`

### worktrunk

Source plugin root:

- Local: `opencode-marketplace/plugins/worktrunk/`
- Remote: `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/`

Create these relative paths under the selected target root:

- `skills/worktrunk/SKILL.md`
- `skills/worktrunk/reference/config.md`
- `skills/worktrunk/reference/hook.md`
- `skills/worktrunk/reference/list.md`
- `skills/worktrunk/reference/llm-commits.md`
- `skills/worktrunk/reference/remove.md`
- `skills/worktrunk/reference/shell-integration.md`
- `skills/worktrunk/reference/step.md`
- `skills/worktrunk/reference/switch.md`
- `skills/worktrunk/reference/merge.md`
- `skills/worktrunk/reference/faq.md`
- `skills/worktrunk/reference/codex.md`
- `skills/worktrunk/reference/tips-patterns.md`
- `skills/worktrunk/reference/troubleshooting.md`
- `skills/worktrunk/reference/worktrunk.md`

Fetch them from:

- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/config.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/hook.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/list.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/llm-commits.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/remove.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/shell-integration.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/step.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/switch.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/merge.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/faq.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/codex.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/tips-patterns.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/troubleshooting.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/worktrunk.md`

When installing locally from this repo, use these source paths instead:

- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/SKILL.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/config.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/hook.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/list.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/llm-commits.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/remove.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/shell-integration.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/step.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/switch.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/merge.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/faq.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/codex.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/tips-patterns.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/troubleshooting.md`
- `opencode-marketplace/plugins/worktrunk/skills/worktrunk/reference/worktrunk.md`

### atlassian

Source plugin root:

- Local: `opencode-marketplace/plugins/atlassian/`
- Remote: `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/`

Create these relative paths under the selected target root:

- `skills/atlassian-capture-tasks-from-meeting-notes/SKILL.md`
- `skills/atlassian-capture-tasks-from-meeting-notes/references/action-item-patterns.md`
- `skills/atlassian-generate-status-report/SKILL.md`
- `skills/atlassian-generate-status-report/references/jql-patterns.md`
- `skills/atlassian-generate-status-report/references/report-templates.md`
- `skills/atlassian-generate-status-report/scripts/jql_builder.py`
- `skills/atlassian-query-jira-work/SKILL.md`
- `skills/atlassian-query-jira-work/references/query-examples.md`
- `skills/atlassian-search-company-knowledge/SKILL.md`
- `skills/atlassian-spec-to-backlog/SKILL.md`
- `skills/atlassian-spec-to-backlog/references/breakdown-examples.md`
- `skills/atlassian-spec-to-backlog/references/epic-templates.md`
- `skills/atlassian-spec-to-backlog/references/ticket-writing-guide.md`
- `skills/atlassian-triage-issue/SKILL.md`
- `skills/atlassian-triage-issue/references/bug-report-templates.md`
- `skills/atlassian-triage-issue/references/search-patterns.md`
- `skills/atlassian-query-jira-work/references/board-sprint-resolution.md`
- `opencode.json` (created or updated by merging `opencode-marketplace/plugins/atlassian/opencode.fragment.json`)

Fetch them from:

- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-capture-tasks-from-meeting-notes/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-capture-tasks-from-meeting-notes/references/action-item-patterns.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/references/jql-patterns.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/references/report-templates.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/scripts/jql_builder.py`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-query-jira-work/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-query-jira-work/references/query-examples.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-search-company-knowledge/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/references/breakdown-examples.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/references/epic-templates.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/references/ticket-writing-guide.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-triage-issue/SKILL.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-triage-issue/references/bug-report-templates.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-triage-issue/references/search-patterns.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/skills/atlassian-query-jira-work/references/board-sprint-resolution.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/atlassian/opencode.fragment.json`

When installing locally from this repo, use these source paths instead:

- `opencode-marketplace/plugins/atlassian/skills/atlassian-capture-tasks-from-meeting-notes/SKILL.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-capture-tasks-from-meeting-notes/references/action-item-patterns.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/SKILL.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/references/jql-patterns.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/references/report-templates.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-generate-status-report/scripts/jql_builder.py`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-query-jira-work/SKILL.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-query-jira-work/references/query-examples.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-search-company-knowledge/SKILL.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/SKILL.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/references/breakdown-examples.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/references/epic-templates.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-spec-to-backlog/references/ticket-writing-guide.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-triage-issue/SKILL.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-triage-issue/references/bug-report-templates.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-triage-issue/references/search-patterns.md`
- `opencode-marketplace/plugins/atlassian/skills/atlassian-query-jira-work/references/board-sprint-resolution.md`
- `opencode-marketplace/plugins/atlassian/opencode.fragment.json`

### mneme

Source plugin root:

- Local: `opencode-marketplace/plugins/mneme/`
- Remote: `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/`

Create these relative paths under the selected target root:

- `plugins/mneme.js`
- `commands/mneme-doctor.md`
- `commands/mneme-plugin.md`
- `commands/mneme-remember.md`
- `commands/mneme-setup.md`
- `commands/mneme-stats.md`
- `skills/mneme/SKILL.md`

Fetch them from:

- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/plugins/mneme.js`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/commands/mneme-doctor.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/commands/mneme-plugin.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/commands/mneme-remember.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/commands/mneme-setup.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/commands/mneme-stats.md`
- `https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/opencode-marketplace/plugins/mneme/skills/mneme/SKILL.md`

When installing locally from this repo, use these source paths instead:

- `opencode-marketplace/plugins/mneme/plugins/mneme.js`
- `opencode-marketplace/plugins/mneme/commands/mneme-doctor.md`
- `opencode-marketplace/plugins/mneme/commands/mneme-plugin.md`
- `opencode-marketplace/plugins/mneme/commands/mneme-remember.md`
- `opencode-marketplace/plugins/mneme/commands/mneme-setup.md`
- `opencode-marketplace/plugins/mneme/commands/mneme-stats.md`
- `opencode-marketplace/plugins/mneme/skills/mneme/SKILL.md`

## Verification

After installation:

1. Confirm every expected file exists.
2. Summarize which plugins were installed.
3. List the new OpenCode surface area now available.

For `slop-review`, report:

- Skill: `ai-slop-review`
- Command: `/slop-review-review`

For `worktrunk`, report:

- Skill: `worktrunk`

For `atlassian`, report:

- Skills: `atlassian-capture-tasks-from-meeting-notes`,
  `atlassian-generate-status-report`, `atlassian-query-jira-work`,
  `atlassian-search-company-knowledge`, `atlassian-spec-to-backlog`,
  `atlassian-triage-issue`
- MCP server: `atlassian`
- Next step: run `opencode mcp auth atlassian`

For `mneme`, report:

- Runtime plugin: `plugins/mneme.js`
- Skill: `mneme`
- Commands: `/mneme-doctor`, `/mneme-plugin`, `/mneme-remember`, `/mneme-setup`, `/mneme-stats`
- Next steps:
  - restart OpenCode or start a fresh session so the new local plugin, commands, and skill load
  - run `mneme doctor --json`
  - if needed, start the daemon with `mneme server start`
  - then use the installed `/mneme-*` commands or the `mneme` skill

## Notes

- Always ask before choosing `local` vs `global` unless the user already specified it.
- If the user asks to install multiple plugins, apply the same conflict checks to each one.
- If the user selects `all`, install every currently supported plugin.
- A successful local install should leave these files present:
  - `.opencode/commands/slop-review-review.md`
  - `.opencode/skills/ai-slop-review/SKILL.md`
  - `.opencode/skills/ai-slop-review/references/go.md`
  - `.opencode/skills/ai-slop-review/references/python.md`
  - `.opencode/skills/ai-slop-review/references/rust.md`
  - `.opencode/skills/ai-slop-review/references/svelte-ts.md`
- A successful global install should leave the same relative files under
  `~/.config/opencode/`.
- A successful local install of `worktrunk` should leave these files present:
  - `.opencode/skills/worktrunk/SKILL.md`
  - `.opencode/skills/worktrunk/reference/config.md`
  - `.opencode/skills/worktrunk/reference/hook.md`
  - `.opencode/skills/worktrunk/reference/list.md`
  - `.opencode/skills/worktrunk/reference/llm-commits.md`
  - `.opencode/skills/worktrunk/reference/remove.md`
  - `.opencode/skills/worktrunk/reference/shell-integration.md`
  - `.opencode/skills/worktrunk/reference/step.md`
  - `.opencode/skills/worktrunk/reference/switch.md`
  - `.opencode/skills/worktrunk/reference/merge.md`
  - `.opencode/skills/worktrunk/reference/faq.md`
  - `.opencode/skills/worktrunk/reference/codex.md`
  - `.opencode/skills/worktrunk/reference/tips-patterns.md`
  - `.opencode/skills/worktrunk/reference/troubleshooting.md`
  - `.opencode/skills/worktrunk/reference/worktrunk.md`
- A successful global install of `worktrunk` should leave the same relative files under
  `~/.config/opencode/`.
- A successful local install of `atlassian` should leave these files present:
  - `.opencode/skills/atlassian-capture-tasks-from-meeting-notes/SKILL.md`
  - `.opencode/skills/atlassian-capture-tasks-from-meeting-notes/references/action-item-patterns.md`
  - `.opencode/skills/atlassian-generate-status-report/SKILL.md`
  - `.opencode/skills/atlassian-generate-status-report/references/jql-patterns.md`
  - `.opencode/skills/atlassian-generate-status-report/references/report-templates.md`
  - `.opencode/skills/atlassian-generate-status-report/scripts/jql_builder.py`
  - `.opencode/skills/atlassian-query-jira-work/SKILL.md`
  - `.opencode/skills/atlassian-query-jira-work/references/query-examples.md`
  - `.opencode/skills/atlassian-search-company-knowledge/SKILL.md`
  - `.opencode/skills/atlassian-spec-to-backlog/SKILL.md`
  - `.opencode/skills/atlassian-spec-to-backlog/references/breakdown-examples.md`
  - `.opencode/skills/atlassian-spec-to-backlog/references/epic-templates.md`
  - `.opencode/skills/atlassian-spec-to-backlog/references/ticket-writing-guide.md`
  - `.opencode/skills/atlassian-triage-issue/SKILL.md`
  - `.opencode/skills/atlassian-triage-issue/references/bug-report-templates.md`
  - `.opencode/skills/atlassian-triage-issue/references/search-patterns.md`
  - `.opencode/skills/atlassian-query-jira-work/references/board-sprint-resolution.md`
- `.opencode/opencode.json` created or updated via fragment merge
- A successful global install of `atlassian` should leave the same relative files under
  `~/.config/opencode/`.
- A successful local install of `mneme` should leave these files present:
  - `.opencode/plugins/mneme.js`
  - `.opencode/commands/mneme-doctor.md`
  - `.opencode/commands/mneme-plugin.md`
  - `.opencode/commands/mneme-remember.md`
  - `.opencode/commands/mneme-setup.md`
  - `.opencode/commands/mneme-stats.md`
  - `.opencode/skills/mneme/SKILL.md`
- After installing `mneme`, restart OpenCode or begin a fresh session before expecting the local runtime plugin, commands, and skill to be available.
- After reload, run `mneme doctor --json`; if the daemon is not reachable, start it with `mneme server start`.
- A successful global install of `mneme` should leave the same relative files under
  `~/.config/opencode/`.

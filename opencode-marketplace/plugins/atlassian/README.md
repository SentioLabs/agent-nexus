# Atlassian for OpenCode

OpenCode port of the Atlassian MCP plugin.

## Install

Use the repository install entrypoint:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/.opencode/INSTALL.md
```

Then choose `atlassian` or `all`.

## Runtime Surface

- `skills/`
- `opencode.fragment.json` source file, merged into target `opencode.json`

## Included Skills

- `atlassian-capture-tasks-from-meeting-notes`
- `atlassian-generate-status-report`
- `atlassian-query-jira-work`
- `atlassian-search-company-knowledge`
- `atlassian-spec-to-backlog`
- `atlassian-triage-issue`

## Authentication

After installation, run:

```bash
opencode mcp auth atlassian
```

<p align="center">
  <img src="images/atlassian_logo_brand_RGB.svg" alt="Atlassian">
</p>

# Atlassian for Codex

This directory is a **Codex-only** packaging of Atlassian's Rovo MCP workflows for Jira, Confluence, and Compass.

It intentionally does **not** try to be a dual Claude/Codex package. Atlassian already ships an official Claude Code integration upstream; this copy is tailored for the Codex plugin marketplace used in this repository.

## What is included

- Codex marketplace metadata in `.codex-plugin/plugin.json`
- Bundled Atlassian MCP configuration in `.mcp.json`
- Reusable Atlassian skills under `skills/`
- Atlassian branding assets used by Codex install surfaces
- A repo-local validator script updated for this marketplace layout

## Install in Codex

1. Make sure this repo marketplace is available to Codex through `.agents/plugins/marketplace.json`.
2. Install or enable the `atlassian` plugin from the Sentio Labs marketplace in Codex.
3. The plugin bundles the Atlassian Rovo MCP endpoint, so Codex should add the `atlassian` MCP server as part of plugin installation.
4. Complete authentication if Codex prompts for it, or run:

```bash
codex mcp login atlassian
```

If the plugin was installed before `.mcp.json` was added, reinstall or refresh the plugin so Codex picks up the bundled MCP config.

If your organization uses API-token based auth instead of OAuth, you can still override the server manually with a bearer token environment variable:

```bash
codex mcp add atlassian \
  --url https://mcp.atlassian.com/v1/mcp \
  --bearer-token-env-var ATLASSIAN_MCP_TOKEN
```

Restart Codex after installation if the plugin or Atlassian tools do not appear immediately.

## Included skills

- `search-company-knowledge`: Search Confluence, Jira, and related internal knowledge.
- `spec-to-backlog`: Turn a Confluence spec into a Jira epic and implementation backlog.
- `capture-tasks-from-meeting-notes`: Extract action items and create Jira tasks.
- `query-jira-work`: Resolve board-aware active sprint questions and list personal Jira tickets.
- `triage-issue`: Search for duplicates and file or update Jira bugs.
- `generate-status-report`: Summarize Jira progress and publish reports to Confluence.

These skills assume the Atlassian Rovo MCP server is already connected in Codex and the corresponding Atlassian tools are available.

For board-based Jira work queries, the plugin resolves the board name first, then looks up the board's active sprint, then queries Jira by the resolved sprint ID. That keeps requests like "show me my tickets for the active sprint on the mobile board" general-purpose without hardcoding board IDs.

## Recommended project context

If your team mostly works in a small set of Jira projects or Confluence spaces, give Codex explicit defaults in `AGENTS.md` so it can skip unnecessary discovery calls.

```md
## Atlassian Rovo MCP

When connected to Atlassian MCP:
- MUST use Jira project key = YOURPROJ
- MUST use Confluence spaceId = "123456"
- MUST use cloudId = "https://yoursite.atlassian.net" unless the user asks otherwise
- MUST use maxResults: 10 or limit: 10 for Jira JQL and Confluence CQL searches
```

## Security and admin notes

The Atlassian Rovo MCP server uses your existing Atlassian permissions. Treat it like any other high-trust tool connection:

- Use least privilege for Jira, Confluence, and Compass access.
- Prefer OAuth when possible, or scope API tokens narrowly.
- Require human confirmation for destructive or high-impact actions.
- Review Atlassian audit logs and organization controls if your workspace manages MCP centrally.

Helpful references:

- [Atlassian Rovo MCP server docs](https://support.atlassian.com/atlassian-rovo-mcp-server/)
- [Understand Atlassian Rovo MCP server](https://support.atlassian.com/security-and-access-policies/docs/understand-atlassian-rovo-mcp-server/)
- [MCP risk awareness](https://www.atlassian.com/blog/artificial-intelligence/mcp-risk-awareness)

## Attribution

The skill content in this directory originated from Atlassian's public Atlassian MCP server repository and has been repackaged here for Codex-specific installation and marketplace metadata.

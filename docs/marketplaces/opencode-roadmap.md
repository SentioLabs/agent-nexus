# OpenCode Roadmap

This roadmap keeps the OpenCode rollout staged so the repo can validate the content model
before adding packaging or release automation.

## Phase 1

Goal: establish the OpenCode marketplace tree, installer entrypoint, and one pilot plugin.

Included:

- `opencode-marketplace/`
- `.opencode/INSTALL.md`
- OpenCode validation in repo automation
- `slop-review` port

Deferred:

- root bootstrap package
- release automation
- hook-heavy plugins

Exit criteria:

- OpenCode can install the pilot plugin into project-local `.opencode/`
- validators pass
- docs explain the model clearly

## Phase 2

Goal: prove OpenCode's mixed runtime model using markdown commands/skills plus local `.opencode/plugins/*.js` hook plugins and optional `opencode.json` fragment merges.

Included:

- port `worktrunk`
- port `atlassian`
- port `mneme`
- define the OpenCode skill namespacing rule for globally unique skill names
- document why `opencode plugin <module>` does not yet replace `.opencode/INSTALL.md`

Exit criteria:

- one hook-backed plugin works end-to-end
- one MCP or config-backed plugin works end-to-end
- install flow supports one, many, or all available OpenCode plugins

## Phase 3

Goal: lock the long-term naming rules and document blockers for the highest-risk deferred plugin.

Included:

- define OpenCode agent packaging conventions
- finalize command and agent namespacing rules
- document why `arc` remains deferred despite the available local plugin runtime

Exit criteria:

- naming conventions are stable
- blocker docs clearly explain why `arc` is not yet portable
- no plugin needs ad hoc packaging exceptions

Deferred with blockers:

- `arc`: the current `arc` skill corpus still assumes unsupported or unverified OpenCode workflow primitives (`TaskCreate`, `AskUserQuestion`, `Agent`/`Task` tool dispatch, `subagent_type`, `isolation: "worktree"`, `/arc:*` routing), so a maintainable priming-only OpenCode port does not exist yet

## Phase 4

Goal: add the nicer one-line OpenCode install UX.

Likely implementation:

- root `package.json`
- root `.opencode/plugins/agent-nexus.js` bootstrap plugin

Target UX:

```json
{
  "plugin": ["agent-nexus@git+https://github.com/sentiolabs/agent-nexus.git"]
}
```

Selective plugin install is also a goal once OpenCode plugin options are verified for this
repo's bootstrap package.

Exit criteria:

- one-line install works
- installing all plugins works
- installing a selected subset works without manual file copying

## Phase 5

Goal: add versioning or release automation only if it becomes useful.

Possible reasons to do it:

- stable tags for pinned OpenCode installs
- automated changelog maintenance
- cleaner maintainer release flow

Exit criteria:

- the automation clearly reduces maintainer overhead
- tags or versions are useful to OpenCode users

# Marketplace Review and Update Design

Date: 2026-04-20
Status: Approved in conversation, pending written spec review

## Context

Codex and OpenCode both recently improved their skill and plugin support. This repository already has a mature Codex marketplace subtree, but OpenCode is still in an early staged rollout with only the `slop-review` pilot ported.

The goal of this pass is not parity for its own sake. The goal is to re-evaluate both marketplace trees against current platform capabilities, refresh anything that has drifted, and expand OpenCode only where the runtime model is now clean, supportable, and testable.

## Goals

- Audit current Codex and OpenCode support for marketplace runtime features used in this repo
- Refresh existing Codex and OpenCode marketplace files for current platform behavior
- Expand OpenCode beyond `slop-review` where the port is now a clean fit
- Make the supported surface explicit in validators, install docs, READMEs, and roadmap guidance
- Make plugin-level decisions explicit so future work can continue from written criteria rather than guesswork

## Non-Goals

- Force full Codex and OpenCode parity in one pass
- Introduce repo-specific packaging hacks just to land a hard plugin now
- Add release automation unless the review shows a concrete need tied to the current work
- Rework unrelated marketplace structure outside the review and porting goals above

## Current Baseline

- `codex-marketplace/plugins/` currently contains `arc`, `atlassian`, `mneme`, `slop-review`, and `worktrunk`
- `opencode-marketplace/plugins/` currently contains only `slop-review`
- OpenCode installation is installer-driven through `.opencode/INSTALL.md`
- Existing roadmap guidance still treats hook-backed, MCP-backed, and complex multi-agent ports as later phases

## Execution Model

The work will run in four ordered stages.

### 1. Capability Audit

Review current Codex and OpenCode behavior for:

- skills
- commands
- agents
- hooks
- MCP or config-backed plugin support
- installer expectations
- command and agent naming constraints

The output of this stage is a platform support matrix with per-feature status:

- `supported`
- `usable with degradation`
- `blocked`

### 2. Repo Audit

Audit every existing marketplace plugin against the capability matrix.

This stage produces two inventories:

- Codex refresh items: outdated manifests, docs, hooks, naming, or packaging assumptions
- OpenCode candidate statuses: `already supported`, `easy port`, `conditional port`, or `defer`

### 3. Selective OpenCode Expansion

Port only the plugins whose runtime model fits the audited OpenCode surface.

Expected ordering:

- `worktrunk`: first candidate to evaluate for porting, because it appears to be the cleanest current fit
- `mneme`: only if the updated OpenCode model now has a credible hook or config path
- `arc`: only if agents, command naming, and priming behavior all clear the gate below
- `atlassian`: only if MCP or config support is clearly first-class

### 4. Guardrails and Documentation

Update the repository-level surfaces that define and enforce support:

- marketplace validators
- `.opencode/INSTALL.md`
- marketplace READMEs
- migration guidance
- roadmap notes for anything deferred

## Plugin Decision Rules

Each plugin must end this pass in exactly one of these states:

### Refresh Only

The existing marketplace copy remains supported, but this pass only updates docs, manifests, validators, or packaging assumptions.

### Port Now

The plugin gets a new or refreshed OpenCode copy in this pass because the runtime model is already clean and testable.

### Port With Intentional Degradation

The plugin is supported on OpenCode in a reduced form only if the degraded behavior is still coherent and documented. Losing automation is acceptable only when the remaining workflow is still usable and the docs are explicit about the change.

### Defer With Blockers

The plugin is not ported now, and the repo records the exact platform gap, repo rule gap, or verification gap that blocked it.

## Expected Per-Plugin Classification

These are the default expectations before the capability audit confirms or rejects them:

- `slop-review`: refresh only
- `worktrunk`: port now unless the audit finds a naming or install constraint that changes the fit
- `mneme`: conditional; port only if OpenCode now has a real hook or config story
- `arc`: conditional; port only if agent packaging, command namespacing, and priming behavior are supportable without hacks
- `atlassian`: conditional-to-defer; move now only if MCP or config support is clearly first-class

## Arc Decision Gate

`arc` should be reviewed in this pass, but it should only ship as an OpenCode plugin if all of the following are true:

- OpenCode now has a stable agent packaging model that does not require repo-specific hacks
- OpenCode's flat command namespace is manageable for `arc`'s command surface with clear naming rules
- `arc`'s priming behavior has a credible OpenCode story, either through real hook support or an intentionally degraded manual mode that still makes sense as a supported plugin
- install and validation complexity remain maintainable after the port

If any of those conditions fail, `arc` is deferred with a written blocker list and roadmap update instead of being punted vaguely.

## Deliverables

The implementation work derived from this design should produce:

- a written support matrix for current Codex and OpenCode marketplace capabilities used by this repo
- refreshed Codex marketplace files where recent platform changes made assumptions stale
- refreshed OpenCode marketplace files for the existing `slop-review` pilot
- new OpenCode plugin copies only for plugins that pass the decision rules above
- updated validators and install instructions that cover the supported OpenCode surface
- updated roadmap or migration guidance that explains anything intentionally deferred

## Verification Expectations

Before the work is considered complete, verification must cover:

- Codex marketplace validation
- OpenCode marketplace validation
- JSON validity for any touched manifests or config fragments
- `.opencode/INSTALL.md` coverage for every supported plugin selection and installed file path
- OpenCode command and agent naming compliance for any newly added plugin files
- confirmation that any intentionally degraded plugin behavior is explicitly documented

## Success Criteria

This pass is successful if:

- both marketplace trees reflect current Codex and OpenCode behavior rather than stale assumptions
- the repo has an explicit, reviewable decision for every plugin in scope
- OpenCode support expands only where the runtime model is clean enough to maintain
- deferred plugins have specific blocker notes rather than vague future intent
- validators and install docs match the supported runtime surface

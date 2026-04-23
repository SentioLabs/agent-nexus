# Changelog

## [0.8.0](https://github.com/SentioLabs/agent-nexus/compare/codex-arc-v0.7.0...codex-arc-v0.8.0) (2026-04-23)


### Features

* **codex:** reset versions to 0.1.0 for codex ([64d9134](https://github.com/SentioLabs/agent-nexus/commit/64d91348b103e69a8d47d35d0796f2fbad81f05b))
* **marketplace:** expand opencode support and defer arc honestly ([c03bb56](https://github.com/SentioLabs/agent-nexus/commit/c03bb5614deb9f28d62e20728a006cc024ca9988))

## [0.7.1] - 2026-04-21

### Features

- add `arc-spec-reviewer` for exact task-compliance checks in the Codex `arc` workflow
- dispatch spec review alongside reviewer and evaluator in the Codex `implement` flow

### Fixes

- finish syncing Claude `arc` planning wording into the Codex `plan` skill, including the stronger anti-placeholder explanation and self-review loop
- adopt the richer `PASS | PARTIAL | NEEDS_CONTEXT | DONE_WITH_CONCERNS` contract in the Codex implementer and implement orchestrator
- make the Codex `review` skill explicit about evaluator-active vs evaluator-not-dispatched behavior

## [0.7.0](https://github.com/SentioLabs/agent-nexus/compare/codex-arc-v0.6.0...codex-arc-v0.7.0) (2026-04-04)


### Features

* **arc:** add semantic search and symbol navigation guidance ([e371741](https://github.com/SentioLabs/agent-nexus/commit/e371741f292723d60e44954764e84222d02239f1))

## [0.6.0](https://github.com/SentioLabs/claude-marketplace/compare/arc-v0.5.0...arc-v0.6.0) (2026-04-02)


### Features

* **arc:** add adversarial evaluator agent for independent spec verification ([1e52a78](https://github.com/SentioLabs/claude-marketplace/commit/1e52a7866a5ada95695c1e139999b9aad889997e))


### Bug Fixes

* **arc:** sandbox evaluator in worktree, split health checks from setup failures ([225ee8f](https://github.com/SentioLabs/claude-marketplace/commit/225ee8f7716e13248785467742e887ba86d1f734))

## [0.5.0](https://github.com/SentioLabs/claude-marketplace/compare/arc-v0.4.1...arc-v0.5.0) (2026-03-25)


### Features

* **arc:** add SessionStart hook to register AI sessions ([3a41d3c](https://github.com/SentioLabs/claude-marketplace/commit/3a41d3c67407bb3fd4536afc934d635bc2293403))

## [0.4.1](https://github.com/SentioLabs/claude-marketplace/compare/arc-v0.4.0...arc-v0.4.1) (2026-03-24)


### Bug Fixes

* **arc/plan:** pass plan file path to agent instead of pasting content ([5459fd7](https://github.com/SentioLabs/claude-marketplace/commit/5459fd78cd10dd716013d5211f9f12b175984b0f))

## [0.4.0](https://github.com/SentioLabs/claude-marketplace/compare/arc-v0.3.0...arc-v0.4.0) (2026-03-22)


### Features

* **arc/brainstorm:** add routing analysis to guide plan vs implement decision ([f779b43](https://github.com/SentioLabs/claude-marketplace/commit/f779b430f213f0e134807cafaae45ec81a22152a))

## [0.3.0](https://github.com/SentioLabs/claude-marketplace/compare/arc-v0.2.0...arc-v0.3.0) (2026-03-22)


### Features

* **mneme:** rename plugin from loci-ctx to mneme ([c633ee8](https://github.com/SentioLabs/claude-marketplace/commit/c633ee89e6615c594026df6c6b703f4957edc6e9))

## [0.2.0](https://github.com/SentioLabs/claude-marketplace/compare/arc-v0.1.32...arc-v0.2.0) (2026-03-22)


### Features

* initial marketplace with arc and loci-ctx plugins ([309c039](https://github.com/SentioLabs/claude-marketplace/commit/309c039f4532fda6226d6c2e7e487b4257324bd6))

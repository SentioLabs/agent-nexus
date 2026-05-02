# frontend-design for OpenCode

OpenCode port of Anthropic's `frontend-design` plugin.

## Included Runtime Files

- `skills/frontend-design/SKILL.md`

## Install

Install the npm package in your OpenCode project:

```bash
npm install @sentiolabs/opencode-frontend-design
```

Then add the plugin to your OpenCode configuration:

```js
import FrontendDesignPlugin from "@sentiolabs/opencode-frontend-design";

export default {
  plugins: [FrontendDesignPlugin],
};
```

The repository installer remains supported.

Use the repository install entrypoint:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/.opencode/INSTALL.md
```

Then choose `frontend-design` or `all`.

## OpenCode Surface

- Skill: `frontend-design`

## Attribution

This package is adapted from Anthropic's official `frontend-design` Claude Code plugin and is distributed under Apache-2.0. See `LICENSE` for terms.

# OpenCode Arc Proof Log

Date: 2026-04-20

## Goal

Capture end-to-end evidence for the interactive OpenCode `arc` workflow contract before any support docs flip from deferred to supported.

## Questions To Prove

- Can an interactive OpenCode surface dispatch sequentially into named `arc-*` agents?
- Can interactive OpenCode sessions round-trip native structured questions?
- Can a real OpenCode workflow create and update todos?
- Can the OpenCode runtime plugin fail-open while auto-running `arc prime`?
- Can `arc-evaluator` stay honest without claiming worktree isolation?

## Evidence

- Primary runtime contract is interactive-first:
  - interactive web sessions, interactive CLI sessions, and attached sessions are the primary verification surfaces
  - `opencode run` is testing-only and not part of the primary workflow contract until separately proven

- Clean-home harness setup succeeded:
  - `opencode --help` exited `0`
  - `opencode agent list` exited `0`
- Minimal `opencode run` repro now succeeds when the model is forced:
  - `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode run --model opencode/gpt-5-nano "hello from opencode provider repro"`
  - Output confirmed the run completed normally with `gpt-5-nano`
- Default clean-home `opencode run` path is not reliable in this environment:
  - it defaulted to `zai-org/GLM-5.1`
  - it failed with `The requested model 'zai-org/GLM-5.1' is not supported by any provider you have enabled.`
- Proof command and skill resolution succeeded:
  - `HOME=/tmp/opencode-arc-proof-home XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home/.config opencode run --dir /tmp/opencode-arc-proof-project --model opencode/gpt-5-nano --command arc-proof "validate question, todo, and subagent support; use native question tool if available; use native task tool with agent arc-implementer for one tiny bounded task only"`
  - the temp plugin tree loaded
  - `arc-proof` command resolution occurred
  - `Skill "arc-proof"` loaded in output
- Native todo support is proven in the proof workspace:
  - log file `2026-04-21T013844.log` contains `service=bus type=todo.updated publishing`
  - the rendered output showed the todo list evolving across proof steps
- Native question support is not yet proven end-to-end:
  - the `question` tool is registered in the proof run log
  - no `question.asked` or `question.replied` event was observed
  - the assistant rendered a plain-text multiple-choice prompt instead of using the native question flow
- Named `arc-*` agent registration is present in the proof workspace after adding `mode: subagent`:
  - `arc-evaluator (subagent)`
  - `arc-implementer (subagent)`
  - `arc-reviewer (subagent)`
- Runtime inspection narrows the subagent blocker:
  - `opencode agent list` shows `arc-implementer (subagent)` with a normal subagent permission set
  - the local task tool implementation resolves `subagent_type` through the agent registry and fails only when `H.get(E.subagent_type)` returns nothing
  - the same runtime advertises all non-primary agents as available task agent types and the local agent schema explicitly supports `mode: subagent`
- Named `arc-*` subagent dispatch is still not proven:
  - the proof output repeatedly reported `arc-implementer` as unavailable or not a valid agent type
  - the log shows `permission permission=task pattern=arc-implementer` being evaluated
  - earlier proof logs also show the model trying invalid task patterns such as `arc-proof-subtask`, `tiny-task`, and `subagent`, which strongly suggests the observed rejection came from the model emitting the wrong `subagent_type`, not from agent registration failing
  - no successful subtask execution or `subagent_test_ok` result came from a real subagent; only the inline bash fallback succeeded
- Native question support in `run` mode now looks like a runtime-mode limitation, not just a prompting miss:
  - the local OpenCode SDK exposes `question.asked`, `question.replied`, `/question`, and `/question/{requestID}/reply`
  - `opencode run --help` exposes only a one-shot message surface and no CLI answer path for pending questions
  - the proof `run` session was created with `question` denied in the session permission set, even though the question tool was registered later in tool resolution
  - no `question.asked` or `question.replied` event was observed in the proof logs
- Fresh minimal `opencode run` repros became unstable later in the same temp home:
  - direct follow-up `opencode run --dir /tmp/opencode-arc-proof-project --model opencode/gpt-5-nano ...` attempts failed immediately with `Error: Session not found`
  - those later attempts did not create a fresh session, so they do not change the earlier proof conclusions; they do show the current temp home is no longer a reliable environment for a clean confirmatory rerun
- Fresh local rerun in a brand-new temp home is also unstable for direct local `run`:
  - `HOME=/tmp/opencode-arc-proof-home-fresh XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home-fresh/.config opencode run --dir /tmp/opencode-arc-proof-project-fresh --model opencode/gpt-5-nano "hello from fresh harness"`
  - failed immediately with `Error: Session not found`
  - the same fresh home still succeeded for `opencode agent list`, so this looks like a local `run`-path issue rather than failed agent registration
- Attached-session subagent proof establishes named `arc-*` dispatch on an interactive/attached surface:
  - started headless server successfully on a fresh home with `opencode serve --hostname 127.0.0.1 --port 4197`
  - `opencode run --attach http://127.0.0.1:4197 --password proofpass --dir /tmp/opencode-arc-proof-project-fresh --model opencode/gpt-5-nano "Use the task tool exactly once with subagent_type arc-implementer ..."`
  - rendered output showed a real `Arc-Implementer Agent` task run and completion
  - captured output in `/tmp/opencode-arc-proof-attach-subagent.txt` reported: `The subagent returned the exact text: subagent_test_ok.`
  - server log `2026-04-21T154118.log` contains a real child session creation with title `Run bounded action via arc-implementer to test task tool protocol (@arc-implementer subagent)`
- Attached-session `run` question repro still does not prove native structured question flow:
  - `opencode run --attach http://127.0.0.1:4197 --password proofpass --dir /tmp/opencode-arc-proof-project-fresh --model opencode/gpt-5-nano "Use the native question tool exactly once ..."`
  - plain output mode produced no tool-driven question event and no question reply path
  - JSON output mode produced a text block that visually rendered a yes/no prompt instead of a native question event
  - no `question.asked`, `question.replied`, or `/question` activity appeared in `2026-04-21T154118.log`
- OpenCode marketplace agent frontmatter needed one compatibility fix before the interactive harness would load:
  - copied Codex agents used a YAML `tools:` array, but local OpenCode agent config expects a `tools:` record
  - converting the five `arc-*` agents to OpenCode-style `tools:` maps removed the config error and let the harness load normally
- Current interactive proof harness now registers the shipped `arc-*` agents and skills:
  - `HOME=/tmp/opencode-arc-proof-home-interactive XDG_CONFIG_HOME=/tmp/opencode-arc-proof-home-interactive/.config opencode agent list`
  - shows `arc-doc-writer (subagent)`, `arc-evaluator (subagent)`, `arc-implementer (subagent)`, `arc-issue-tracker (subagent)`, and `arc-reviewer (subagent)`
- Attached-session subagent proof now works through the real OpenCode `arc-implement` skill, not only through a raw prompt:
  - `opencode run --attach http://127.0.0.1:4297 --dir /tmp/opencode-arc-proof-project-interactive --model opencode/gpt-5-nano "First load the arc-implement skill ... arc-implementer ... subagent_test_ok"`
  - output in `/tmp/opencode-arc-proof-interactive-subagent.txt` says `Skill "arc-implement"` loaded and the subagent returned `subagent_test_ok`
  - server log `2026-04-21T183621.log` shows `permission permission=task pattern=arc-implementer` being evaluated in the installed harness
- Attached-session question proof still fails even when the real OpenCode `arc-brainstorm` skill is loaded:
  - `opencode run --attach http://127.0.0.1:4297 --dir /tmp/opencode-arc-proof-project-interactive --model opencode/gpt-5-nano --format json "First load the arc-brainstorm skill ... Ask exactly one native multiple-choice approval question ..."`
  - JSON output in `/tmp/opencode-arc-proof-interactive-question.jsonl` shows the skill loading, then a failed `task` call with `Unknown agent type: arc-brainstorm is not a valid agent type`
  - the model then fell back to a rendered text approval prompt instead of using the native question mechanism
  - no `question.asked` or `question.replied` event appeared in the interactive harness logs for session `ses_24eaa4128ffekRoD4fl1FoMCWG`
- Interactive web proof in a live repo now establishes the shipped `arc` workflow end-to-end:
  - OpenCode web run `c38444d6-5abb-482d-9c0e-e4a879c12023` created live session `ses_24e3327faffeqNPhdyC7uumS5c` in `/home/bfirestone/.local/share/chezmoi` (`/home/bfirestone/.local/share/opencode/log/2026-04-21T203705.log:480`)
  - native question round-trips are present in the session log, including explicit ask and reply events such as:
    - `question.asked` / `question.replied` with answer `Docstring only (Recommended)` (`2026-04-21T203705.log:1329-1338`)
    - additional native ask/reply cycles later in the workflow (`2026-04-21T203705.log:2077-2085`, `2598-2606`, `2906-2914`, `4022-4046`, `4488-4496`)
    - tracked-work approval via native question with answer `Approve tracked work` (`2026-04-21T203705.log:8570-8579`)
  - the brainstorm stage wrote and registered a real design artifact with:
    - `arc plan create "docs/plans/2026-04-21-op-read-value-docstring-design.md"` (`2026-04-21T203705.log:3697-3698`)
    - `arc plan approve plan.00z1kg` (`2026-04-21T203705.log:4705-4706`)
  - the planning stage dispatched real `arc-issue-tracker` child sessions from the main session:
    - `Create Arc issue (@arc-issue-tracker subagent)` (`2026-04-21T203705.log:5831`)
    - `Verify Arc issue (@arc-issue-tracker subagent)` (`2026-04-21T203705.log:6994`)
  - the implementation stage dispatched the expected named subagents from the same parent session:
    - `Implement Arc task (@arc-implementer subagent)` (`2026-04-21T203705.log:9924`)
    - `Review Arc change (@arc-reviewer subagent)` (`2026-04-21T203705.log:13528`)
    - `Evaluate Arc change (@arc-evaluator subagent)` (`2026-04-21T203705.log:14515`)
  - the tiny task took the single-issue path through `arc-plan`:
    - direct `arc show chezmoi-09y7.09j575` now reports one closed `task` with title `Update op_read_value docstring`
    - that issue description still points back to `Approved plan: plan.00z1kg` and `docs/plans/2026-04-21-op-read-value-docstring-design.md`
  - the task lifecycle reached close-out in the live repo:
    - the main session executed `arc close chezmoi-09y7.09j575 --reason "Implemented: updated op_read_value docstring to document op read, trailing-newline removal, and None on failure"` (`2026-04-21T203705.log:25939-25940`)
    - a post-close `git status --short` check followed in the same session (`2026-04-21T203705.log:26130-26131`)

## Result

- PARTIAL: the target contract is interactive-first across interactive web, interactive CLI, and attached sessions. The current proof now establishes the shipped `arc` workflow end-to-end on an interactive web session in a live repo: native question flow, planner registration and approval, tracked-work creation, named subagent dispatch, and final issue close are all evidenced above. That is strong proof for interactive web, but not yet full contract proof. The current narrowed blockers are:
- fail-open plugin auto-run of `arc prime` is not yet proven end-to-end by this log, even though the proof plugin code is written to fail open
- `arc-evaluator` honesty without worktree isolation is only partially supported by the current evidence: the proof agent instructions explicitly forbid claiming isolation and require `BLOCKED` when unsafe, but this log does not yet show a separate adversarial or cleanup-sensitive evaluator proof that confirms the behavior under stress
- the clean-home default model selection is not trustworthy without an explicit supported model override
- attached-session invocation via `opencode run --attach ...` remains useful partial evidence for named `arc-*` subagent dispatch, but it is no longer the only positive surface because interactive web is now proven separately
- native structured question flow is now proven on interactive web, but it is still not proven on interactive CLI, standalone `run`, or attached-session `run`; the installed `arc-brainstorm` skill still failed to produce a native question event on the attached-session proof surface, so those surfaces remain outside the proven question-flow set
  - direct/local one-shot `opencode run` is currently unstable in this environment with fresh-home `Session not found` failures, so it remains unstable/testing-only and is not part of the primary workflow contract

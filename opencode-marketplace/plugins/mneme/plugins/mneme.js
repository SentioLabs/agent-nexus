export const MnemePlugin = async ({ $ }) => {
  const routedTools = new Set(["bash", "webfetch", "read", "grep"])
  const runHook = async (event) => {
    try {
      await $`mneme hook ${event} --platform opencode --server 127.0.0.1:7435`
    } catch {
      // Fail open so missing mneme runtime does not block normal OpenCode flow.
    }
  }

  return {
    "tool.execute.before": async (input) => {
      if (routedTools.has(input.tool)) {
        await runHook("pretooluse")
      }
    },
    "tool.execute.after": async (input) => {
      if (routedTools.has(input.tool)) {
        await runHook("posttooluse")
      }
    },
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await runHook("sessionstart")
      }
      if (event.type === "session.compacted") {
        await runHook("precompact")
      }
      if (event.type === "session.idle") {
        await runHook("stop")
      }
    },
  }
}

export default MnemePlugin

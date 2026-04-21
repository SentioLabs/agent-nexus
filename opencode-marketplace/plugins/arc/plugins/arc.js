export const ArcPlugin = async ({ $ }) => ({
  event: async ({ event }) => {
    if (event.type !== "session.created" && event.type !== "session.compacted") {
      return
    }
    try {
      await $`arc prime`
    } catch {
      // Fail open so missing or unhealthy arc never blocks OpenCode.
    }
  },
})
export default ArcPlugin

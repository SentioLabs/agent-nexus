import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.dirname(fileURLToPath(import.meta.url));

export const FrontendDesignPlugin = async () => ({
  config: async (config) => {
    config.skills ??= {};
    config.skills.paths ??= [];

    const skillsPath = path.join(pluginRoot, "skills");
    if (!config.skills.paths.includes(skillsPath)) {
      config.skills.paths.push(skillsPath);
    }
  },
});

export default FrontendDesignPlugin;

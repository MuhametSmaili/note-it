import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.mts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      dir: "./src",
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/config/test-setup.ts",
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/icons/**", "src/config/**", "src/utils/types/**"],
      },
    },
  }),
);

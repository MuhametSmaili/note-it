import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

const root = import.meta.dirname;

const createSharedConfig = () =>
  ({
    root,
    base: "./",
    plugins: [
      react({ compiler: { target: "19", reportDiagnostics: true } }),
      tailwindcss(),
      svgr({ include: "**/*.svg", svgrOptions: { jsxRuntime: "automatic" } }),
      {
        name: "pdfmake-sync-png",
        enforce: "pre",
        transform: {
          filter: { id: /\/pdfmake\/build\/pdfmake\.js$/ },
          handler(code) {
            const decoder = "const png_js_browser_inflate = unzlib ;";
            if (code.split(decoder).length !== 2 || !code.includes("function unzlibSync(")) {
              throw new Error("pdfmake PNG decoder changed. Review the CSP workaround for pdfmake#2951.");
            }
            return {
              code: code.replace(
                decoder,
                "const png_js_browser_inflate = (data, callback) => callback(null, unzlibSync(data));",
              ),
              map: null,
            };
          },
        },
      },
      {
        name: "watch-tailwind-sources",
        transform: {
          filter: { id: /\/src\/styles\/tailwind\.css(?:\?.*)?$/ },
          handler() {
            this.addWatchFile(path.resolve(root, "src"));
          },
        },
      },
    ],
    resolve: {
      alias: {
        "@platform": path.resolve(root, "src/platform"),
        "@app": path.resolve(root, "src/app"),
        "@screens": path.resolve(root, "src/screens"),
        "@modules": path.resolve(root, "src/modules"),
        "@components": path.resolve(root, "src/components"),
        "@utils": path.resolve(root, "src/utils"),
        "@styles": path.resolve(root, "src/styles"),
        "@icons": path.resolve(root, "src/icons"),
        "@hooks": path.resolve(root, "src/hooks"),
      },
    },
  }) satisfies UserConfig;

const pages = createSharedConfig();

export default defineConfig({
  ...pages,
  publicDir: "src/static",
  build: {
    outDir: "build/.shared",
    target: ["chrome120", "firefox140"],
    emptyOutDir: false,
    rolldownOptions: {
      input: {
        popup: path.resolve(root, "popup.html"),
        "frame-content": path.resolve(root, "frame-content.html"),
      },
    },
  },
});

/** Create one shared IIFE file for an extension script. */
export function scriptConfig(name: "background" | "crop-area" | "frame-script"): UserConfig {
  return {
    ...createSharedConfig(),
    publicDir: false,
    build: {
      outDir: "build/.shared",
      target: ["chrome120", "firefox140"],
      emptyOutDir: false,
      lib: {
        name: `NoteIt_${name.replaceAll("-", "_")}`,
        entry: path.resolve(
          root,
          name === "background" ? "src/background/background.ts" : `src/content-script/${name}.tsx`,
        ),
        formats: ["iife"],
        fileName: () => `${name}.js`,
      },
    },
  };
}

import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import type { Plugin } from "vite";
import pages, { scriptConfig } from "../vite.config.mts";

const watch = process.argv.includes("--watch");

await rm(new URL("../build", import.meta.url), { recursive: true, force: true });

const require = createRequire(import.meta.url);
const libraries = new URL("../build/.shared/libraries/", import.meta.url);
const coreDirectory = path.dirname(require.resolve("tesseract.js-core"));
await mkdir(libraries, { recursive: true });
await Promise.all([
  copyFile(require.resolve("tesseract.js/dist/worker.min.js"), new URL("worker.min.js", libraries)),
  copyFile(require.resolve("tesseract.js/LICENSE.md"), new URL("tesseract.js-LICENSE.md", libraries)),
  copyFile(path.join(coreDirectory, "LICENSE"), new URL("tesseract.js-core-LICENSE", libraries)),
  ...(await readdir(coreDirectory))
    .filter((file) => file.endsWith("-lstm.wasm.js"))
    .map((file) => copyFile(path.join(coreDirectory, file), new URL(file, libraries))),
]);

const targets = ["chrome", "firefox"] as const;
const shared = new URL("../build/.shared/", import.meta.url);
const manifestDirectory = new URL("../manifests/", import.meta.url);

const readManifest = async (name: string) => {
  const value: unknown = JSON.parse(await readFile(new URL(`${name}.json`, manifestDirectory), "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid ${name} manifest.`);
  return value;
};

const publishPackages = async () => {
  const base = await readManifest("base");
  await Promise.all(
    targets.map(async (target) => {
      const overrides = await readManifest(target);
      const output = new URL(`../build/${target}/`, import.meta.url);
      await cp(shared, output, { recursive: true });
      await writeFile(new URL("manifest.json", output), `${JSON.stringify({ ...base, ...overrides }, null, 2)}\n`);
    }),
  );
};

let publishing = Promise.resolve();
const packagePlugin = (): Plugin => ({
  name: "browser-packages",
  buildStart() {
    this.addWatchFile(new URL("../src/static/", import.meta.url).pathname);
    this.addWatchFile(manifestDirectory.pathname);
  },
  async writeBundle() {
    publishing = publishing.catch(() => undefined).then(publishPackages);
    await publishing;
  },
});

for (const config of [pages, scriptConfig("background"), scriptConfig("crop-area"), scriptConfig("frame-script")]) {
  await build({
    ...config,
    plugins: [...(config.plugins ?? []), packagePlugin()],
    configFile: false,
    mode: watch ? "development" : "production",
    css: { ...config.css, devSourcemap: watch },
    define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") },
    build: {
      ...config.build,
      watch: watch ? {} : null,
      sourcemap: watch,
      ...(watch ? { minify: false } : {}),
    },
  });
}

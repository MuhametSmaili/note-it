import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import config from "../../.oxlintrc.json" with { type: "json" };
import tsconfig from "../../tsconfig.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "../..");
const require = createRequire(import.meta.url);
const oxlint = path.join(path.dirname(require.resolve("oxlint/package.json")), "bin/oxlint");

export async function lint(filename: string, code: string, fixtures: string[] = []) {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), "note-it-lint-")));
  try {
    for (const file of fixtures) {
      const destination = path.join(directory, file);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, "export const value = 1;\nexport type Value = number;\n");
    }
    await writeFile(path.join(directory, "tsconfig.json"), JSON.stringify(tsconfig));
    await writeFile(
      path.join(directory, ".oxlintrc.json"),
      JSON.stringify({
        ...config,
        options: { ...config.options, typeAware: false },
        jsPlugins: config.jsPlugins.map((plugin) =>
          plugin.startsWith(".") ? path.resolve(root, plugin) : require.resolve(plugin),
        ),
        settings: {
          ...config.settings,
          "better-tailwindcss": {
            ...config.settings["better-tailwindcss"],
            cwd: root,
            entryPoint: path.join(root, "src/styles/tailwind.css"),
          },
        },
      }),
    );
    const file = path.join(directory, filename);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, code);
    const result = spawnSync(process.execPath, [oxlint, "--format", "json", file], {
      cwd: directory,
      encoding: "utf8",
      timeout: 15_000,
    });
    if (result.error) throw result.error;
    if (!result.stdout.trimStart().startsWith("{")) {
      throw new Error(result.stdout || result.stderr || "Oxlint produced no JSON report.");
    }
    const report: unknown = JSON.parse(result.stdout);
    return { status: result.status, report };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

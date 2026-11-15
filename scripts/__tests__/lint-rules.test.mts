import { expect, it } from "vitest";
import { lint } from "./lint-fixture.mts";

it.each([
  ["camelCase function", "src/utils/probe.ts", "export const saveNote = () => 1;"],
  ["named component", "src/components/probe.tsx", "export function NoteCard() { return <div />; }"],
  ["constant", "src/utils/probe.ts", "export const MAX_NOTES = 10;"],
  ["PascalCase type", "src/utils/probe.ts", "export type NoteSnapshot = { id: string };"],
  ["external property", "src/utils/probe.ts", "export const read = (value: { note_id: string }) => value.note_id;"],
  [
    "external destructuring",
    "src/utils/probe.ts",
    "export const read = ({ note_id }: { note_id: string }) => note_id;",
  ],
  ["test directory", "src/utils/__tests__/probe.ts", "export const value = 1;"],
  ["hook suffix", "src/hooks/use-note.hook.ts", "export const useNote = () => 1;"],
  ["component", "src/components/probe.tsx", 'export const NoteCard = () => <div className="bg-primary text-body" />;'],
  [
    "custom utility and variants",
    "src/components/probe.tsx",
    'export const NoteCard = () => <div className="icon-circle cursor-custom hover:bg-highlight bg-light/80" />;',
  ],
  [
    "conditional classes",
    "src/components/probe.tsx",
    'import clsx from "clsx"; export const NoteCard = ({ active }: { active: boolean }) => <div className={clsx(active ? "bg-primary" : "bg-light")} />;',
  ],
  [
    "variant-specific utilities",
    "src/components/probe.tsx",
    'export const NoteCard = () => <div className="p-2 hover:p-4 md:p-6" />;',
  ],
  [
    "class map",
    "src/components/probe.ts",
    'export const variantClasses = { primary: "bg-primary text-body", active: "bg-highlight" };',
  ],
])("allows %s", async (_name, filename, code) => {
  const result = await lint(filename, code);

  expect(result).toMatchObject({ status: 0, report: { diagnostics: [] } });
});

it.each([
  ["filename", "src/utils/badName.ts", "export const value = 1;", "unicorn(filename-case)"],
  ["directory", "src/badDirectory/probe.ts", "export const value = 1;", "conventions(directories)"],
  ["function", "src/utils/probe.ts", "export function save_note() { return 1; }", "eslint(id-match)"],
  ["arrow function", "src/utils/probe.ts", "export const save_note = () => 1;", "eslint(id-match)"],
  [
    "capitalized utility",
    "src/utils/probe.ts",
    "export function SaveNote() { return 1; }",
    "conventions(function-names)",
  ],
  ["constant-cased function", "src/utils/probe.ts", "export const SAVE_NOTE = () => 1;", "conventions(function-names)"],
  [
    "named function expression",
    "src/utils/probe.ts",
    "export const saveNote = function SAVE_NOTE() { return 1; };",
    "conventions(function-names)",
  ],
  ["type", "src/utils/probe.ts", "export type noteSnapshot = { id: string };", "conventions(type-names)"],
  ["interface", "src/utils/probe.ts", "export interface noteSnapshot { id: string; }", "conventions(type-names)"],
  ["class", "src/utils/probe.ts", "export class noteSnapshot {}", "conventions(type-names)"],
  [
    "unknown utility",
    "src/components/probe.tsx",
    'export const NoteCard = () => <div className="bg-does-not-exist" />;',
    "better-tailwindcss(no-unknown-classes)",
  ],
  [
    "conflicting utilities",
    "src/components/probe.tsx",
    'export const NoteCard = () => <div className="p-2 p-4" />;',
    "better-tailwindcss(no-conflicting-classes)",
  ],
  [
    "concatenated utility",
    "src/components/probe.tsx",
    "export const NoteCard = ({ color }: { color: string }) => <div className={`bg-${color}`} />;",
    "better-tailwindcss(no-concatenated-classes)",
  ],
  [
    "unknown clsx utility",
    "src/components/probe.tsx",
    'import clsx from "clsx"; export const NoteCard = () => <div className={clsx("bg-does-not-exist")} />;',
    "better-tailwindcss(no-unknown-classes)",
  ],
  [
    "unknown class map utility",
    "src/components/probe.ts",
    'export const variantClasses = { primary: "bg-does-not-exist" };',
    "better-tailwindcss(no-unknown-classes)",
  ],
  [
    "parameter limit",
    "src/utils/probe.ts",
    "export const sum = (a: number, b: number, c: number, d: number) => a + b + c + d;",
    "eslint(max-params)",
  ],
  [
    "nesting limit",
    "src/utils/probe.ts",
    "export function read(a: boolean) { if (a) { if (a) { if (a) { if (a) { if (a) { return 1; } } } } } return 0; }",
    "eslint(max-depth)",
  ],
  [
    "complexity limit",
    "src/utils/probe.ts",
    `export function read(value: number) { ${Array.from({ length: 21 }, (_, index) => `if (value === ${index}) return ${index};`).join(" ")} return -1; }`,
    "eslint(complexity)",
  ],
  [
    "unnecessary else",
    "src/utils/probe.ts",
    "export function read(value: boolean) { if (value) { return 1; } else { return 0; } }",
    "eslint(no-else-return)",
  ],
])("rejects %s", async (_name, filename, code, rule) => {
  const result = await lint(filename, code);

  expect(result).toMatchObject({
    status: 1,
    report: { diagnostics: expect.arrayContaining([expect.objectContaining({ code: rule })]) },
  });
});

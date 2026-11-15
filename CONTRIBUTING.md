# Code quality

Use Node.js 26 or newer, then run `npm ci`.

## Commands

- `npm run check`: lint, formatting, types, unit/component tests, and lint/architecture fixtures.
- `npm run format`: format code and sort Tailwind classes.
- `npm run lint:fix`: apply safe lint fixes.
- `npm run test:extension`: build and test the Chrome and Firefox packages.

Pre-commit checks staged files. Pre-push runs `npm run check`. CI runs the same check and the extension suite.

## Naming

- Use kebab-case for source filenames and directories. `__tests__` is the test-directory exception.
- Use camelCase for ordinary functions and variables, PascalCase for components and types, and UPPER_SNAKE_CASE for constants.
- Use `useNotes`-style names for hooks. Keep the existing `.hook.ts` and `.provider.tsx` suffixes where applicable.
- Name callback props `onDeleteNote` and local handlers `handleDeleteNote`.
- Name Tailwind class maps with a `Classes` suffix, such as `variantClasses`.

Lint checks declaration-name shapes, PascalCase types, function names, and code-directory names. PascalCase function names are permitted in TSX for components; review that distinction and the callback/hook naming conventions. External property names and destructured bindings retain their API spelling. A leading or trailing underscore is allowed for ignored bindings or name collisions.

## Tailwind

Use the theme in `src/styles/tailwind.css`, including semantic utilities such as `bg-primary`, `bg-highlight`, and `text-body`.

Write complete class names. Use `clsx(active ? "bg-highlight" : "bg-light")` rather than constructing utility names from fragments.

Oxfmt sorts classes in JSX attributes and `clsx` calls, and removes duplicates. Oxlint rejects unknown, conflicting, and concatenated utilities in supported class locations, including values in `*Classes` maps. Keep mutually exclusive utilities in conditional branches.

## Ownership

- Put screen-specific components, hooks, helpers, and tests under `src/screens/<screen>/`.
- Other consumers must use the public screen entries listed in `scripts/architecture-plugin.mts`. The screenshot screen exposes separate crop and frame integration entries.
- Put reusable controls under `src/components/`.
- Use a domain module's public entries. Keep runtime capabilities in adapters and bind them in composition roots.

Add allowed and rejected fixtures when changing an architectural boundary. Tests can access their own screen or module's implementation.

## Maintainability

Functions have limits of 3 parameters, 4 nested blocks, and cyclomatic complexity 20. Test files are exempt from the parameter limit so parameterized callbacks can receive fixture fields. Prefer early returns over unnecessary `else` branches.

Keep names meaningful and responsibilities cohesive. These require review in addition to automated checks.

The enforcement sources are `.oxlintrc.json`, `.oxfmtrc.json`, `scripts/architecture-plugin.mts`, and `scripts/conventions-plugin.mts`. `npm run test:lint` exercises the real lint configuration with valid and invalid fixtures.

import { isBuiltin } from 'node:module';
import path from 'node:path';
import type { Context, ESTree, Node, Plugin, Visitor } from '@oxlint/plugins';
import { ResolverFactory } from 'oxc-resolver';

const publicEntries = new Set(['modules/notes/use-notes.hook.ts']);
const adapters = new Set(['modules/notes/internal/web-extension.ts']);
const compositionRoots = new Set(['modules/notes/index.ts']);
const owner = (file: string) => /^modules\/([^/]+)\//.exec(file)?.[1];
const isTest = (file: string) => file.includes('/__tests__/') || /\.test\.[cm]?[jt]sx?$/.test(file);
const isReact = (specifier: string) => /^(react|react-dom|@tiptap\/react)(\/|$)/.test(specifier);

function importSpecifier(node: ESTree.Node) {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0]?.value.cooked;
  return undefined;
}

function packageViolation(source: string, domain: boolean, specifier: string) {
  if ((domain || source.startsWith('platform/')) && isReact(specifier)) {
    return 'Domain and platform implementations must not depend on React.';
  }
  if (domain && isBuiltin(specifier)) {
    return 'Domain code must receive runtime capabilities through an adapter.';
  }
  return undefined;
}

function ownershipViolation(source: string, target: string) {
  const targetOwner = owner(target);
  if (
    targetOwner &&
    owner(source) !== targetOwner &&
    target !== `modules/${targetOwner}/index.ts` &&
    !publicEntries.has(target)
  ) {
    return `Use the ${targetOwner} module's public entry point. Its implementation is private.`;
  }
  if (!isTest(source) && isTest(target)) return 'Production code must not depend on test helpers.';
  if (adapters.has(target) && !compositionRoots.has(source) && !isTest(source)) {
    return 'Bind runtime adapters in the module composition entry point.';
  }
  return undefined;
}

function directionViolation(source: string, domain: boolean, target: string) {
  if (domain && (!target.startsWith('modules/') || publicEntries.has(target) || compositionRoots.has(target))) {
    return 'Domain code may depend on domain modules, not views, hooks, or runtime adapters.';
  }
  if (isTest(source)) return undefined;
  if (source.startsWith('platform/') && !target.startsWith('platform/')) {
    return 'Platform code must not depend on application code.';
  }
  if (source.startsWith('components/') && !/^(components|icons|styles)\//.test(target)) {
    return 'Shared UI may depend on shared controls, icons, and styles, not application features.';
  }
  return undefined;
}

function dependencies(context: Context): Visitor {
  const root = path.resolve(context.cwd, 'src');
  const relative = (file: string) => path.relative(root, file).split(path.sep).join('/');
  const source = relative(context.filename);
  const domain = context.options[0] === 'domain';
  const resolver = new ResolverFactory({
    tsconfig: 'auto',
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.json'],
    extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
    conditionNames: ['import', 'default'],
  });
  const report = (node: Node, message: string) => context.report({ node, message });
  const check = (node: ESTree.Node) => {
    const specifier = importSpecifier(node);
    if (typeof specifier !== 'string') {
      if (!source.startsWith('../')) report(node, 'Use a literal import so module ownership can be checked.');
      return;
    }
    const packageError = packageViolation(source, domain, specifier);
    if (packageError) {
      report(node, packageError);
      return;
    }
    const targetPath = resolver.resolveFileSync(context.filename, specifier).path;
    if (!targetPath) return;
    const target = relative(targetPath);
    if (target.includes('/node_modules/')) {
      const dependency = target.split('/node_modules/').at(-1) ?? '';
      const resolvedPackageError = packageViolation(source, domain, dependency);
      if (resolvedPackageError) report(node, resolvedPackageError);
      return;
    }
    const violation = ownershipViolation(source, target) ?? directionViolation(source, domain, target);
    if (violation) report(node, violation);
  };

  return {
    ImportDeclaration: (node) => check(node.source),
    ExportNamedDeclaration: (node) => {
      if (node.source) check(node.source);
    },
    ExportAllDeclaration: (node) => check(node.source),
    ImportExpression: (node) => check(node.source),
    TSImportType: (node) => check(node.source),
    TSExternalModuleReference: (node) => check(node.expression),
    CallExpression: (node) => {
      if (node.callee.type === 'Identifier' && node.callee.name === 'require' && node.arguments[0]) {
        const reference = context.sourceCode.getScope(node).references.find((item) => item.identifier === node.callee);
        if (!reference?.resolved?.defs.length) check(node.arguments[0]);
      }
    },
  };
}

export default {
  meta: { name: 'architecture' },
  rules: {
    dependencies: {
      meta: { schema: [{ enum: ['domain'] }] },
      create: dependencies,
    },
  },
} satisfies Plugin;

import path from "node:path";
import type { Context, ESTree, Plugin, Visitor } from "@oxlint/plugins";

function directories(context: Context): Visitor {
  return {
    Program(node) {
      const relative = path.relative(context.cwd, context.filename).split(path.sep);
      if (!["src", "scripts", "e2e", "test"].includes(relative[0] ?? "")) return;
      for (const directory of relative.slice(1, -1)) {
        if (directory === "__tests__" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(directory)) continue;
        context.report({ node, message: `Use kebab-case for the "${directory}" directory.` });
      }
    },
  };
}

function typeNames(context: Context): Visitor {
  const check = (node: { id: ESTree.BindingIdentifier | null }) => {
    if (node.id && !/^[A-Z][a-zA-Z0-9]*$/.test(node.id.name)) {
      context.report({ node: node.id, message: "Use PascalCase for class, type, interface, and enum names." });
    }
  };
  return {
    ClassDeclaration: (node) => check(node),
    ClassExpression: (node) => check(node),
    TSTypeAliasDeclaration: (node) => check(node),
    TSInterfaceDeclaration: (node) => check(node),
    TSEnumDeclaration: (node) => check(node),
  };
}

function functionNames(context: Context): Visitor {
  const check = (id: ESTree.BindingIdentifier | null) => {
    if (!id || /^_?[a-z][a-zA-Z0-9]*_?$/.test(id.name)) return;
    if (context.filename.endsWith(".tsx") && /^[A-Z][a-zA-Z0-9]*$/.test(id.name)) return;
    context.report({ node: id, message: "Use camelCase for functions. PascalCase is reserved for components in TSX." });
  };
  return {
    FunctionDeclaration: (node) => check(node.id),
    FunctionExpression: (node) => check(node.id),
    VariableDeclarator(node) {
      if (
        node.id.type === "Identifier" &&
        (node.init?.type === "ArrowFunctionExpression" || node.init?.type === "FunctionExpression")
      ) {
        check(node.id);
      }
    },
  };
}

export default {
  meta: { name: "conventions" },
  rules: {
    directories: { meta: { schema: [] }, create: directories },
    "type-names": { meta: { schema: [] }, create: typeNames },
    "function-names": { meta: { schema: [] }, create: functionNames },
  },
} satisfies Plugin;

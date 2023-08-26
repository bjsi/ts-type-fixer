import { z } from "zod";
import { ts, Node, ImplementedKindToNodeMappings } from "ts-morph";
import { Tool } from "modelfusion";
import { getSourceFiles as getProjectSourceFiles, project } from "./tsProject";
import { Fail, Success } from "../types/types";

export const humanReadableKind = [
  "function",
  "class",
  "type",
  "enum",
  "variable",
  "parameter",
  "property",
] as const;

export const humanReadableToSyntaxKind = {
  ["function"]: ["FunctionDeclaration"],
  ["class"]: ["ClassDeclaration"],
  ["type"]: [
    "InterfaceDeclaration",
    "TypeAliasDeclaration",
    "EnumDeclaration",
    "ClassDeclaration",
  ],
  ["enum"]: ["EnumDeclaration"],
  ["variable"]: ["VariableDeclaration"],
  ["parameter"]: ["Parameter"],
  ["property"]: ["PropertyDeclaration"],
} as const;

export const syntaxKindToHumanReadable = {};
for (const [humanReadable, syntaxKinds] of Object.entries(
  humanReadableToSyntaxKind
)) {
  for (const syntaxKind of syntaxKinds) {
    // @ts-ignore
    if (!syntaxKindToHumanReadable[syntaxKind]) {
      // @ts-ignore
      syntaxKindToHumanReadable[syntaxKind] = [];
    }
    // @ts-ignore
    syntaxKindToHumanReadable[syntaxKind].push(humanReadable);
  }
}

export const syntaxKinds = Object.values(humanReadableToSyntaxKind).flat();
export type SyntaxKinds = (typeof ts.SyntaxKind)[(typeof syntaxKinds)[number]];
export type NodeType = ImplementedKindToNodeMappings[SyntaxKinds];

export function getPositionInfoFromNode(node: Node) {
  return {
    line: node.getStartLineNumber(),
    file: node.getSourceFile().getFilePath(),
    code: node.getText().split("\n")[0],
    // @ts-ignore
    kind: syntaxKindToHumanReadable[node.getKindName()],
  };
}

export function getMatchingNodes(
  name: string,
  kind: (typeof humanReadableKind)[number][],
  files: string[]
): Success<Node<ts.Node>[]> | Fail<string> {
  const sourceFiles = getProjectSourceFiles().filter(
    (f) => !files || files?.includes(f.getFilePath())
  );

  const nodesWithMatchingKind = sourceFiles
    .map((f) => {
      const syntaxKinds =
        kind?.map((k) => humanReadableToSyntaxKind[k]).flat() ||
        Object.values(humanReadableToSyntaxKind).flat();
      return f
        .getDescendants()
        .filter((d) => syntaxKinds.some((k) => d.isKind(ts.SyntaxKind[k])));
    })
    .filter((x) => x.length > 0)
    .flat();

  const nodesWithMatchingName = nodesWithMatchingKind.filter(
    (n) => (n as NodeType).getName() === name
  );

  if (nodesWithMatchingName.length === 0) {
    return {
      success: false,
      error: "Could not find that code element.",
    };
  }
  return {
    success: true,
    data: nodesWithMatchingName,
  };
}

export const findDeclaration = new Tool({
  name: "findDeclaration",
  description:
    "Find where a particular code element (function, class, type, etc) is declared.",

  inputSchema: z.object({
    name: z.string(),
    kind: z
      .array(z.enum(humanReadableKind))
      .optional()
      .describe("Array of code elements to filter by. Defaults to any."),
    files: z
      .array(z.string())
      .optional()
      .describe("Array of files to search in. Defaults to all."),
  }),

  execute: async ({ name, kind, files }) => {
    console.time("findDeclaration");

    const maybeNodes = getMatchingNodes(name, kind || [], files || []);
    if (!maybeNodes.success) {
      return maybeNodes;
    }
    const info = maybeNodes.data.map(getPositionInfoFromNode);

    const filteredInfo =
      info.length > 15
        ? info.slice(0, 15) + `\n ${info.length - 15} more...`
        : info;
    console.timeEnd("findDeclaration");
    return {
      success: true,
      data: JSON.stringify(filteredInfo, null, 2),
    };
  },
});

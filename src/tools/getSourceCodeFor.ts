import { z } from "zod";
import {
  EnumDeclaration,
  InterfaceDeclaration,
  Project,
  TypeAliasDeclaration,
} from "ts-morph";
import { Fail, Success } from "../types/types";
import { project } from "./tsProject";
import { Tool } from "modelfusion";
import {
  getMatchingNodes,
  getPositionInfoFromNode,
  humanReadableKind,
} from "./findDeclaration";

export const get_source_code_for_type_or_interface_schema = z.object({
  typeOrInterface: z.string(),
});

export const getSourceCodeFor = new Tool({
  name: "getSourceCodeFor",
  description:
    "Get the source code for a particular code element (type, interface, function etc).",
  inputSchema: z.object({
    name: z.string(),
    kind: z.enum(humanReadableKind),
    file: z.string(),
  }),
  execute: async ({ name, kind, file }) => {
    const nodes = getMatchingNodes(name, [kind], [file]);
    if (!nodes.success) {
      return nodes;
    } else if (nodes.data.length === 0) {
      return {
        success: false,
        error: "Error: Declaration not found.",
      };
    } else if (nodes.data.length > 1) {
      const text = nodes.data.map(getPositionInfoFromNode);
      return {
        success: false,
        error:
          "Error: Multiple declarations found\n\n" +
          JSON.stringify(text, null, 2),
      };
    } else {
      const node = nodes.data[0];
      const startLine = node.getStartLineNumber();
      const lines = node
        .getText()
        .split("\n")
        .map((text, i) => `${startLine + i}: ${text}`)
        .join("\n");
      return {
        success: true,
        data: lines,
        file: node.getSourceFile().getFilePath(),
      };
    }
  },
});

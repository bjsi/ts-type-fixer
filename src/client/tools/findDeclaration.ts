import { Tool } from "modelfusion";
import { trpc } from "../trpc";
import { findDeclarationSchema } from "../../shared/schemas/findDeclaration";

export const findDeclaration = new Tool({
  name: "findDeclaration",
  description:
    "Find where a code element is declared. Does not work for generic type parameters.",

  inputSchema: findDeclarationSchema,
  execute: async (args) => {
    const { name, kind, files } = args;
    const arrKind = Array.isArray(kind) ? kind : !kind ? undefined : [kind];
    return await trpc.findDeclaration.query({ name, kind: arrKind, files });
  },
});

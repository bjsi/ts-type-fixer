import { Tool } from "modelfusion";
import { trpc } from "../trpc";
import { findDeclarationSchema } from "../../shared/schemas/findDeclaration";

export const findDeclaration = new Tool({
  name: "findDeclaration",
  description:
    "Find where a particular code element (function, class, type, etc) is declared.",

  inputSchema: findDeclarationSchema,
  execute: async ({ name, kind, files }) => {
    return await trpc.findDeclaration.query({ name, kind, files });
  },
});

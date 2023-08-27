import { z } from "zod";
import { Tool } from "modelfusion";
import { getSourceCodeForSchema } from "../../shared/schemas/getSourceCodeFor";
import { trpc } from "../trpc";

export const get_source_code_for_type_or_interface_schema = z.object({
  typeOrInterface: z.string(),
});

export const getSourceCodeFor = new Tool({
  name: "getSourceCodeFor",
  description:
    "Get the source code for a particular code element (type, interface, function etc).",
  inputSchema: getSourceCodeForSchema,
  execute: async (args) => {
    return trpc.getSourceCodeFor.query(args);
  },
});

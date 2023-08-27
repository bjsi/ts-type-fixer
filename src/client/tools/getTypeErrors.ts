import { Tool } from "modelfusion";
import { getTypeErrorsInFileSchema } from "../../shared/schemas/getTypeErrorsInFile";
import { trpc } from "../trpc";

export const getTypeErrorsInFile = new Tool({
  name: "getTypeErrors",
  description: "",
  inputSchema: getTypeErrorsInFileSchema,
  execute: async (args) => {
    return trpc.getTypeErrorsInFile.query(args);
  },
});

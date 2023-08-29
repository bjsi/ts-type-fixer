import { Tool } from "modelfusion";
import { writeTextToFileSchema } from "../../shared/schemas/writeTextToFile";
import { trpc } from "../trpc";

export const writeTextToFile = new Tool({
  name: "writeTextToFile",
  description: "Write text to a file.",
  inputSchema: writeTextToFileSchema,
  execute: async (args) => {
    return trpc.writeTextToFile.query(args);
  },
});

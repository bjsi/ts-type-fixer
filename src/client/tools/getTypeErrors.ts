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

export const test = async () => {
  const file =
    "/home/james/Projects/TS/remnote-new/client/src/js/api/queue/queue.ts";
  console.log(await trpc.getTypeErrorsInFile.query({ file }));
};

// initProject(file);

// getNextTypeError(file).then(async (typeErr) => {
//   console.log(typeErr);
//   const sourceFile = project.getSourceFile(file)!;
//   const lines = sourceFile.getFullText().split("\n");
//   lines[0] = "";
//   sourceFile.replaceWithText(lines.join("\n"));

//   getNextTypeError(file).then((typeErr) => {
//     console.log(typeErr);
//   });
// });

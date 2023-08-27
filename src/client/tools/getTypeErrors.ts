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

// export const test = async () => {
//   const file =
//     "/home/james/Projects/TS/remnote-new/client/src/js/api/queue/queue.ts";
//   console.log(await trpc.getTypeErrorsInFile.query({ file }));
//   console.log(
//     await trpc.writeTextToFile.query({
//       file: "/home/james/Projects/TS/remnote-new/client/src/js/api/queue/queue.ts",
//       text: "let hello: number = 5;",
//       lineNumber: 1,
//       mode: "replaceLines",
//     })
//   );
//   console.log(await trpc.getTypeErrorsInFile.query({ file }));
// };

// test();

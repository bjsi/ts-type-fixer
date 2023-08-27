import { z } from "zod";

export const writeTextToFileSchema = z.object({
  file: z.string(),
  text: z.string(),
  mode: z.union([
    z.literal("insertIntoNewLineBefore"),
    z.literal("insertIntoNewLineAfter"),
    z.literal("replaceLines"),
  ]),
  lineNumber: z.number(),
});

export type WriteTextToFileArgs = z.infer<typeof writeTextToFileSchema>;

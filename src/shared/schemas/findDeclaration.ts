import { z } from "zod";
import { humanReadableKind } from "../types/types";

export const findDeclarationSchema = z.object({
  name: z.string(),
  kind: z
    .array(z.enum(humanReadableKind))
    .optional()
    .describe("Array of code elements to filter by. Defaults to any."),
  files: z
    .array(z.string())
    .optional()
    .describe("Array of files to search in. Defaults to all."),
});

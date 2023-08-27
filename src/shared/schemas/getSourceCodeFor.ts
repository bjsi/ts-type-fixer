import { z } from "zod";
import { humanReadableKind } from "../types/types";

export const getSourceCodeForSchema = z.object({
  name: z.string(),
  kind: z.enum(humanReadableKind),
  file: z.string(),
});

export type GetSourceCodeForSchema = z.infer<typeof getSourceCodeForSchema>;

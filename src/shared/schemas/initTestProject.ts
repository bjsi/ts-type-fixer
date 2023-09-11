import { z } from "zod";

export const initTestProjectSchema = z.object({
  sourceFiles: z.record(z.string()),
});

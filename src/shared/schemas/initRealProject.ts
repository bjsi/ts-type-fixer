import { z } from "zod";

export const initRealProjectSchema = z.object({
  tsConfigFilePath: z.string(),
  sourceFiles: z.string().array(),
});

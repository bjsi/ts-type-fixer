import { z } from "zod";

export const typeErrSchema = z.object({
  error_message: z.string(),
  file: z.string(),
  line: z.number().optional(),
  source_code: z.string().optional(),
  pos: z.number().optional(),
});

export type TypeErr = z.infer<typeof typeErrSchema>;

import { z } from "zod";

export const getTypeErrorsInFileSchema = z.object({
  file: z.string(),
});

export type GetTypeErrorsInFileArgs = z.infer<typeof getTypeErrorsInFileSchema>;

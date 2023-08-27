import { z } from "zod";

export const extractFileSkeletonSchema = z.object({
  filePath: z.string(),
});

export type ExtractFileSkeletonArgs = z.infer<typeof extractFileSkeletonSchema>;

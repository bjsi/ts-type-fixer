import { z } from "zod";

export const initTestProjectSchema = z.object({
  directory: z.string(),
});

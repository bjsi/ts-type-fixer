import { Tool } from "modelfusion";
import { extractFileSkeletonSchema } from "../../shared/schemas/extractFileSkeleton";
import { trpc } from "../trpc";

export const extractFileSkeletonTool = new Tool({
  name: "extractFileSkeleton",
  description:
    "Extract the skeleton of a file listing all functions, classes and types. Useful for getting a high-level overview of a file.",
  inputSchema: extractFileSkeletonSchema,
  execute: async (args) => {
    const { filePath } = args;
    return trpc.extractFileSkeleton.query({ filePath });
  },
});

import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { extractFileSkeletonSchema } from "../shared/schemas/extractFileSkeleton";
import { findDeclarationSchema } from "../shared/schemas/findDeclaration";
import { getSourceCodeForSchema } from "../shared/schemas/getSourceCodeFor";
import { getTypeErrorsInFileSchema } from "../shared/schemas/getTypeErrorsInFile";
import { initRealProjectSchema } from "../shared/schemas/initRealProject";
import { initTestProjectSchema } from "../shared/schemas/initTestProject";
import { writeTextToFileSchema } from "../shared/schemas/writeTextToFile";
import { extractFileSkeleton } from "./tools/extractFileSkeleton";
import { findDeclaration } from "./tools/findDeclaration";
import { getSourceCodeFor } from "./tools/getSourceCodeFor";
import { getNextTypeError, getTypeErrorsInFile } from "./tools/getTypeErrors";
import { writeTextToFile } from "./tools/writeFile";
import { publicProcedure, router } from "./trpc";
import { initRealProject, initTestProject } from "./tsProject";

const appRouter = router({
  initTestProject: publicProcedure
    .input(initTestProjectSchema)
    .query(async (ctx) => {
      return initTestProject(ctx.input);
    }),
  initRealProject: publicProcedure
    .input(initRealProjectSchema)
    .query(async (ctx) => {
      return initRealProject(ctx.input);
    }),
  getSourceCodeFor: publicProcedure
    .input(getSourceCodeForSchema)
    .query(async (ctx) => {
      return getSourceCodeFor(ctx.input);
    }),

  getNextTypeErrorInFile: publicProcedure
    .input(getTypeErrorsInFileSchema)
    .query(async (ctx) => {
      return await getNextTypeError(ctx.input.file);
    }),
  getTypeErrorsInFile: publicProcedure
    .input(getTypeErrorsInFileSchema)
    .query(async (ctx) => {
      return getTypeErrorsInFile(ctx.input);
    }),
  findDeclaration: publicProcedure.input(findDeclarationSchema).query((ctx) => {
    return findDeclaration(ctx.input);
  }),
  extractFileSkeleton: publicProcedure
    .input(extractFileSkeletonSchema)
    .query((ctx) => {
      return extractFileSkeleton(ctx.input);
    }),
  writeTextToFile: publicProcedure
    .input(writeTextToFileSchema)
    .query(async (ctx) => {
      return writeTextToFile(ctx.input);
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);

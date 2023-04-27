import { Project } from "ts-morph";

export const project = new Project({
  tsConfigFilePath: "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths([
  "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
  "/home/james/Projects/TS/remnote-new/client/**/*.tsx",
]);

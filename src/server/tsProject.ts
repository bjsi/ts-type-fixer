import { Project } from "ts-morph";

export let project: Project;

// @ts-ignore
if (!project) {
  console.time("init big project");
  project = new Project({
    tsConfigFilePath:
      "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFilesAtPaths([
    "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
    "/home/james/Projects/TS/remnote-new/client/**/*.tsx",
    "/home/james/Projects/TS/remnote-new/client/**/*.ts",
  ]);
  console.timeEnd("init big project");
}

export function getProjectSourceFiles() {
  return project
    .getSourceFiles()
    .filter(
      (f) =>
        f.getFilePath().match(/\.tsx?$/) &&
        !f.getFilePath().match(/\.d\.ts$/) &&
        !f.getFilePath().match(/node_modules/)
    );
}

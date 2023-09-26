import { Project, SourceFile, ts } from "ts-morph";
import * as child_process from "child_process";
import path from "path";

export let project: Project;

export interface InitTypeScriptProjectConfig {
  tsConfigFilePath: string;
  sourceFiles: string[];
}

export interface InitInMemoryProjectConfig {
  directory: string;
}

export const initTestProject = (args: InitInMemoryProjectConfig) => {
  console.time("init test project");
  project = new Project({
    compilerOptions: {
      target: ts.ScriptTarget.ES2015,
      strict: true,
    },
    tsConfigFilePath: "tsconfig.json",
  });
  const testDir = path.join(__dirname, "client/src/tests/" + args.directory);
  project.addSourceFilesAtPaths(testDir + "/**/*.ts");

  console.timeEnd("init test project");
};

export const initRealProject = (config: InitTypeScriptProjectConfig) => {
  console.time("init project");
  project = new Project({
    tsConfigFilePath: config.tsConfigFilePath,
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFilesAtPaths(config.sourceFiles);
  console.timeEnd("init project");
};

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

export function initFullProjectAndGetTypeErrors() {
  console.time("init project");
  if (project) {
    console.log("project already exists!");
    return;
  }

  project = new Project({
    tsConfigFilePath:
      "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
    skipAddingFilesFromTsConfig: true,
  });
  project.addSourceFilesAtPaths([
    "client/src/global.d.ts",
    "/home/james/Projects/TS/remnote-new/client/**/*.tsx",
    "/home/james/Projects/TS/remnote-new/client/**/*.ts",
    // "/home/james/Projects/TS/remnote-new/server/**/*.tsx",
    // "/home/james/Projects/TS/remnote-new/server/**/*.ts",
  ]);
  console.timeEnd("init project");

  console.time("get type errors");
  // Step 1: Get staged files
  const allStagedFiles = child_process
    .execSync("cd /home/james/Projects/TS/remnote-new && git diff --name-only")
    .toString()
    .split("\n");

  console.log("all staged files", allStagedFiles);

  // Step 2: Filter only TypeScript files
  const stagedTsFiles = allStagedFiles
    // only client
    .filter((file) => file.endsWith(".ts") && file.includes("client"))
    .map((file) => `/home/james/Projects/TS/remnote-new/${file}`);

  const types: any[] = [];

  const processDependants = (initialFile: SourceFile) => {
    const langService = project.getLanguageService().compilerObject;
    const queue = [initialFile];
    const seen = new Set();

    while (queue.length > 0) {
      const currentFile = queue.shift();
      if (!currentFile || seen.has(currentFile.getFilePath())) {
        continue;
      }
      seen.add(currentFile.getFilePath());

      const typeErrs = langService.getSemanticDiagnostics(
        currentFile.getFilePath()!
      );
      types.push(...typeErrs);

      const referenced = currentFile.getReferencingNodesInOtherSourceFiles();
      for (const f of referenced) {
        const refFile = f.getSourceFile();
        if (!seen.has(refFile.getFilePath())) {
          queue.push(refFile);
        }
      }
    }
  };

  for (const file of stagedTsFiles) {
    console.log("checking file", file);
    project.addSourceFileAtPath(file);
    const langService = project.getLanguageService().compilerObject;
    const sourceFile = project.getSourceFile(file);
    if (!sourceFile) {
      continue;
    }
    const typeErrs = langService.getSemanticDiagnostics(
      sourceFile.getFilePath()!
    );
    types.push(...typeErrs);
    processDependants(sourceFile);
  }
  console.log("typeErrs", types.length);
  console.timeEnd("get type errors");
}

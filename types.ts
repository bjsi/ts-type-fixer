import { Project } from "ts-morph";

export function get_next_type_error() {
  const project = new Project({
    tsConfigFilePath:
      "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths([
    "/home/james/Projects/TS/remnote-new/client/src/js/ui/queue/Queue.tsx",
    "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
  ]);
  const srcFile = project.getSourceFile(
    "/home/james/Projects/TS/remnote-new/client/src/js/ui/queue/Queue.tsx"
  )!;
  const errors = srcFile!.getPreEmitDiagnostics();
  if (errors.length > 0) {
    const error = errors[0];
    const messageText = error.getMessageText();
    const error_message =
      typeof messageText === "string"
        ? messageText
        : messageText.getMessageText();
    const file = error.getSourceFile()?.getFilePath();
    const line = error.getLineNumber();
    return { error_message, file, line };
  }
  return {
    message: "No type errors found!",
  };
}

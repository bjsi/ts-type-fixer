import { Project } from "ts-morph";

export function get_all_type_errors(file: string) {
  const project = new Project({
    tsConfigFilePath:
      "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths([
    file,
    "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
  ]);
  const srcFile = project.getSourceFile(file)!;
  const errors = srcFile!.getPreEmitDiagnostics();
  return errors.map((error) => {
    const messageText = error.getMessageText();
    const error_message =
      typeof messageText === "string"
        ? messageText
        : messageText.getMessageText();
    const file = error.getSourceFile()?.getFilePath();
    const line = error.getLineNumber();
    return { error_message, file, line };
  });
}

export function get_next_type_error(file: string) {
  const es = get_all_type_errors(file);
  if (es.length === 0) {
    return {
      message: "No type errors",
    };
  } else {
    return es[0];
  }
}

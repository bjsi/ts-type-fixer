import { Project, SourceFile, ts } from "ts-morph";
import { getSourceCode } from "./getSourceCode";

let project: Project;

export const initProject = (file: string) => {
  console.time("init type err project");
  project = new Project({
    tsConfigFilePath:
      "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      skipDefaultLibCheck: true,
      skipLibCheck: true,
      noEmit: true,
    },
  });
  project.addSourceFilesAtPaths([
    "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
    file,
  ]);
  console.timeEnd("init type err project");
};

export async function diagnosticToTypeError(
  file: SourceFile,
  error: ts.Diagnostic
) {
  const diagnostic = error.messageText;
  let error_message = "";
  if (typeof diagnostic === "string") {
    error_message = diagnostic;
  } else {
    const recursivelyConcatErrorMsg = (
      diagnosticMessage: ts.DiagnosticMessageChain
    ) => {
      const message = diagnosticMessage.messageText;
      error_message += message + "\n";
      (diagnosticMessage.next || []).forEach(recursivelyConcatErrorMsg);
    };
    recursivelyConcatErrorMsg(diagnostic);
  }

  function getLineNumberAtPos(str: string, pos: number) {
    // do not allocate a string in this method
    let count = 0;

    const CharCodes = {
      ASTERISK: "*".charCodeAt(0),
      NEWLINE: "\n".charCodeAt(0),
      CARRIAGE_RETURN: "\r".charCodeAt(0),
      SPACE: " ".charCodeAt(0),
      TAB: "\t".charCodeAt(0),
      CLOSE_BRACE: "}".charCodeAt(0),
    };

    for (let i = 0; i < pos; i++) {
      if (str.charCodeAt(i) === CharCodes.NEWLINE) count++;
    }

    return count + 1; // convert count to line number
  }
  /**
   * Gets the line number.
   */
  function getLineNumber() {
    const start = error.start;
    if (start === undefined) {
      return undefined;
    }
    return getLineNumberAtPos(file.getFullText(), start);
  }

  const line = getLineNumber();

  return {
    error_message,
    file: file.getFilePath()!,
    line,
    source: await getSourceCode.execute({
      file: file.getSourceFile().getFilePath()!,
      line: line!,
      numLinesOfContextAfter: 0,
      numLinesOfContextBefore: 0,
    }),
  };
}

export async function getAllTypeErrors(file: string) {
  const sourceFile = project.addSourceFileAtPath(file);
  const errors = project
    .getLanguageService()
    .compilerObject.getSemanticDiagnostics(file);
  return await Promise.all(
    errors.map((e) => diagnosticToTypeError(sourceFile, e))
  );
}

export async function getNextTypeError(file: string) {
  console.time("getAllTypeErrors");
  const errors = await getAllTypeErrors(file);
  console.timeEnd("getAllTypeErrors");
  if (errors.length === 0) {
    return {
      message: "No type errors",
    };
  } else {
    return errors[0];
  }
}

// const file =
//   "/home/james/Projects/TS/remnote-new/client/src/js/api/queue/queue.ts";

// initProject(file);

// getNextTypeError(file).then(async (typeErr) => {
//   console.log(typeErr);
//   const sourceFile = project.getSourceFile(file)!;
//   const lines = sourceFile.getFullText().split("\n");
//   lines[0] = "";
//   sourceFile.replaceWithText(lines.join("\n"));

//   getNextTypeError(file).then((typeErr) => {
//     console.log(typeErr);
//   });
// });

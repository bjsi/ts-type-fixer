import { SourceFile, ts } from "ts-morph";
import { getSourceCode } from "../../client/tools/getSourceCode";
import { GetTypeErrorsInFileArgs } from "../../shared/schemas/getTypeErrorsInFile";
import { Fail, Success, success, fail } from "../../shared/types/types";
import { project } from "../tsProject";

// let project: Project;

// export const initProject = (file: string) => {
//   console.time("init type err project");
//   project = new Project({
//     tsConfigFilePath:
//       "/home/james/Projects/TS/remnote-new/client/tsconfig.json",
//     skipAddingFilesFromTsConfig: true,
//     compilerOptions: {
//       skipDefaultLibCheck: true,
//       skipLibCheck: true,
//       noEmit: true,
//     },
//   });
//   project.addSourceFilesAtPaths([
//     "/home/james/Projects/TS/remnote-new/client/src/global.d.ts",
//     file,
//   ]);
//   console.timeEnd("init type err project");
// };

interface TypeErr {
  error_message: string;
  file: string;
  line: number | undefined;
  source: string | undefined;
}

export async function diagnosticToTypeError(
  file: SourceFile,
  error: ts.Diagnostic
): Promise<TypeErr> {
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
    source: (
      (await getSourceCode.execute({
        file: file.getSourceFile().getFilePath()!,
        line: line!,
        numLinesOfContextAfter: 0,
        numLinesOfContextBefore: 0,
      })) as Success<string>
    ).data,
  };
}

export async function getTypeErrorsInFile(
  args: GetTypeErrorsInFileArgs
): Promise<Fail<string> | Success<TypeErr[]>> {
  const { file } = args;
  const sourceFile = project.getSourceFile(file);
  if (!sourceFile) {
    return fail("File not found");
  }
  return success(await getTypeErrorsInSourceFile(sourceFile));
}

export async function getTypeErrorsInSourceFile(sourceFile: SourceFile) {
  const langService = project.getLanguageService().compilerObject;
  const errors = langService.getSemanticDiagnostics(sourceFile.getFilePath()!);
  return await Promise.all(
    errors.map((e) => diagnosticToTypeError(sourceFile, e))
  );
}

export async function getNextTypeError(file: string) {
  console.time("getAllTypeErrors");
  const errors = await getTypeErrorsInFile({ file });
  if (!errors.success) {
    return errors;
  }

  const data = errors.data;

  console.timeEnd("getAllTypeErrors");
  if (data.length === 0) {
    return {
      message: "No type errors",
    };
  } else {
    return data[0];
  }
}

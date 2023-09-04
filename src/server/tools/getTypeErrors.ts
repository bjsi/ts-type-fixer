import { SourceFile, ts } from "ts-morph";
import { GetTypeErrorsInFileArgs } from "../../shared/schemas/getTypeErrorsInFile";
import { TypeErr } from "../../shared/schemas/typeErr";
import { Fail, Success, success, fail } from "../../shared/types/types";
import { project } from "../tsProject";
import { getErrorContextHierarchy } from "./getErrorContext";

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

  const errInfo = {
    error_message,
    file: file.getFilePath()!,
    line,
    pos: error.start,
  };

  const maybeCtx = getErrorContextHierarchy({ error: errInfo });
  const source_code = maybeCtx.success ? maybeCtx.data : "";
  return {
    ...errInfo,
    source_code: source_code,
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

getNextTypeError(
  "/home/james/Projects/TS/remnote-new/client/src/js/api/component_focus/FocusableComponentContainer.tsx"
).then(console.log);

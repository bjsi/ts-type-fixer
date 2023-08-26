import { Diagnostic, DiagnosticMessageChain, ts } from "ts-morph";
import { getSourceCode } from "./getSourceCode";
import { project } from "./tsProject";

export async function diagnosticToTypeError(error: Diagnostic<ts.Diagnostic>) {
  const diagnostic = error.getMessageText();
  let error_message = "";
  if (typeof diagnostic === "string") {
    error_message = diagnostic;
  } else {
    const recursivelyConcatErrorMsg = (
      diagnosticMessage: DiagnosticMessageChain
    ) => {
      const message = diagnosticMessage.getMessageText();
      error_message += message + "\n";
      (diagnosticMessage.getNext() || []).forEach(recursivelyConcatErrorMsg);
    };
    recursivelyConcatErrorMsg(diagnostic);
  }

  const file = error.getSourceFile()?.getFilePath();
  const line = error.getLineNumber();
  return {
    error_message,
    file,
    line,
    source: await getSourceCode.execute({
      file: file!,
      line: line!,
      numLinesOfContextAfter: 0,
      numLinesOfContextBefore: 0,
    }),
  };
}

export async function getAllTypeErrors(file: string) {
  const srcFile = project.addSourceFileAtPath(file);
  const errors = srcFile.getPreEmitDiagnostics();
  return await Promise.all(errors.map(diagnosticToTypeError));
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

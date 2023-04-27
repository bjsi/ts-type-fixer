import { Diagnostic, DiagnosticMessageChain, ts } from "ts-morph";
import { get_source_code_at_line } from "./get_source_code";
import { project } from "./shared";

export function diagnosticToTypeError(error: Diagnostic<ts.Diagnostic>) {
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
    source: get_source_code_at_line({
      file: file!,
      line: line!,
      numLinesOfContextAfter: 0,
      numLinesOfContextBefore: 0,
    }),
  };
}

export function get_all_type_errors(file: string) {
  const srcFile = project.addSourceFileAtPath(file);
  const errors = srcFile.getPreEmitDiagnostics();
  return errors.map(diagnosticToTypeError);
}

export function get_next_type_error(file: string) {
  const errors = get_all_type_errors(file);
  if (errors.length === 0) {
    return {
      message: "No type errors",
    };
  } else {
    return errors[0];
  }
}

console.log(
  get_next_type_error(
    "/home/james/Projects/TS/remnote-new/client/src/js/ui/queue/SpacedRepetitionBase.tsx"
  )
);

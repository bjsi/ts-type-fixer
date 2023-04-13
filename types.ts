import { Project } from "ts-morph";
const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
});

export function get_next_type_error() {
  const errors = project.getPreEmitDiagnostics();
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

import { Project } from "ts-morph";
const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
});

export function get_next_type_error() {
  //   return {
  //     message: `
  //     tools/write_file.ts:18:5 - error TS2322: Type 'string' is not assignable to type 'Success<string> | Fail<string>'.

  // 18     return \`File does not exist: $\{file\}\`;
  //        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // Found 1 error in tools/write_file.ts:18
  // `.trim(),
  //     line: 18,
  //     file: "tools/write_file.ts",
  //   };
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

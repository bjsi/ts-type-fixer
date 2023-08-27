import { WriteTextToFileArgs } from "../../shared/schemas/writeTextToFile";
import { project } from "../tsProject";
import { getTypeErrorsInFile } from "./getTypeErrors";

export async function writeTextToFile(args: WriteTextToFileArgs) {
  const { file, lineNumber: line, text, mode } = args;

  const sourceFile = project.getSourceFile(file);
  if (!sourceFile) {
    return { success: false, error: `File does not exist: ${file}` };
  }

  const originalContent = sourceFile.getFullText();
  const lines = originalContent.split("\n");

  const newTextLines = text.split("\n");

  if (mode === "insertIntoNewLineAfter") {
    lines.splice(line, 0, ...newTextLines);
  } else if (mode === "insertIntoNewLineBefore") {
    lines.splice(line - 1, 0, ...newTextLines);
  } else if (mode === "replaceLines") {
    lines.splice(line - 1, newTextLines.length, ...newTextLines);
  } else {
    return {
      success: false,
      error: `Invalid mode: ${mode}`,
    };
  }

  const updatedContent = lines.join("\n");
  const errorsBefore = await getTypeErrorsInFile({ file });
  sourceFile.replaceWithText(updatedContent);
  const errorsAfter = await getTypeErrorsInFile({ file });
  if (errorsBefore.length <= errorsAfter.length) {
    sourceFile.replaceWithText(originalContent);
    // within 2 lines of the write location
    const errorsNearline = errorsAfter.filter(
      (err) => err.line && Math.abs(err.line - line) <= 2
    );
    const errorsAsStr = JSON.stringify(errorsNearline, null, 2);
    return {
      success: false,
      error: `Type errors were not reduced. Errors before: ${errorsBefore.length}, errors after: ${errorsAfter.length}\n\n${errorsAsStr}`,
    };
  }

  return {
    success: true,
    data: "File updated successfully.",
  };
}

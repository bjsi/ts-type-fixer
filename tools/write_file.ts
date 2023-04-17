import * as fs from "fs";
import { z } from "zod";
import { get_all_type_errors } from "../types";
import { Fail, Success } from "../types/types";

export const write_text_to_file_schema = z.object({
  file: z.string(),
  text: z.string(),
  mode: z.union([
    z.literal("insertIntoNewLineBefore"),
    z.literal("insertIntoNewLineAfter"),
    z.literal("replaceLines"),
  ]),
  lineNumber: z.number(),
});

type Args = z.infer<typeof write_text_to_file_schema>;

export function write_text_to_file(args: Args): Success<string> | Fail<string> {
  const { file, lineNumber: line, text, mode } = args;

  if (!fs.existsSync(file)) {
    return { success: false, error: `File does not exist: ${file}` };
  }

  const originalContent = fs.readFileSync(file, "utf-8");
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

  const typeErrorsBefore = get_all_type_errors(file);
  const updatedContent = lines.join("\n");
  fs.writeFileSync(file, updatedContent, "utf-8");
  const typeErrorsAfter = get_all_type_errors(file);
  // TODO: maybe include type errors near the line that was changed?
  if (typeErrorsAfter.length >= typeErrorsBefore.length) {
    // fs.writeFileSync(file, originalContent, "utf-8");
    return {
      success: false,
      error: `Either the error was not fixed, or more errors were introduced`,
    };
  }

  return {
    success: true,
    data: "File updated successfully.",
  };
}

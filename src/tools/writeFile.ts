import * as fs from "fs";
import { z } from "zod";
import { getAllTypeErrors } from "./getTypeErrors";
import { Fail, Success } from "../types/types";
import { Tool } from "modelfusion";

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

export const writeTextToFile = new Tool({
  name: "writeTextToFile",
  description: "Write text to a file.",
  inputSchema: write_text_to_file_schema,
  execute: async (args) => {
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

    const typeErrorsBefore = await getAllTypeErrors(file);
    const updatedContent = lines.join("\n");
    fs.writeFileSync(file, updatedContent, "utf-8");
    const typeErrorsAfter = await getAllTypeErrors(file);
    if (typeErrorsAfter.length >= typeErrorsBefore.length) {
      const errsAtLine = typeErrorsAfter
        .filter(
          (err) =>
            err.line != null && err.line >= line - 2 && err.line <= line + 2
        )
        .map((x) => x.error_message)
        .join("\n\n");
      return {
        success: false,
        error: `Either the error was not fixed, or more errors were introduced\n${errsAtLine}`,
      };
    }

    return {
      success: true,
      data: "File updated successfully.",
    };
  },
});

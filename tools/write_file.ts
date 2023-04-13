import * as fs from "fs";
import { z } from "zod";
import { Fail, Success } from "../types/types";

export const write_text_to_file_schema = z.object({
  file: z.string(),
  line: z.number(),
  text: z.string(),
  mode: z.union([z.literal("insertAfter"), z.literal("replace")]),
});

type Args = z.infer<typeof write_text_to_file_schema>;

export function write_text_to_file(args: Args): Success<string> | Fail<string> {
  const { file, line, text, mode } = args;

  if (!fs.existsSync(file)) {
    return { success: false, error: `File does not exist: ${file}` };
  }

  const fileContent = fs.readFileSync(file, "utf-8");
  const lines = fileContent.split("\n");

  const newTextLines = text.split("\n");

  if (mode === "insertAfter") {
    lines.splice(line - 1, 0, ...newTextLines);
  } else if (mode === "replace") {
    lines.splice(line - 1, newTextLines.length, ...newTextLines);
  } else {
    return {
      success: false,
      error: `Invalid mode: ${mode}`,
    };
  }

  const updatedContent = lines.join("\n");
  fs.writeFileSync(file, updatedContent, "utf-8");
  return {
    success: true,
    data: "File updated successfully.",
  };
}

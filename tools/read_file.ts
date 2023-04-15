import * as fs from "fs";
import { z } from "zod";
import { Fail, Success } from "../types/types";

export const read_file_schema = z.object({
  file: z.string(),
});

type Args = z.infer<typeof read_file_schema>;

export function read_file(args: Args): Success<string> | Fail<string> {
  const { file } = args;
  try {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n");
    const data = lines
      .map((lineText, lineIndex) => {
        const lineNum = lineIndex + 1;
        return `${lineNum}: ${lineText}`;
      })
      .join("\n");
    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as any).message,
    };
  }
}

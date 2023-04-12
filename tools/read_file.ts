import * as fs from "fs";
import { z } from "zod";
import { Fail, Success } from "../types/types";

export const get_source_code_at_line_schema = z.object({
  file: z.string(),
  line: z.number(),
  numLinesOfContext: z.number(),
});

type Args = z.infer<typeof get_source_code_at_line_schema>;

export function get_source_code_at_line(
  args: Args
): Success<string> | Fail<string> {
  const { file, line, numLinesOfContext: numLinesContext } = args;
  try {
    const data = fs.readFileSync(file, "utf8");
    const lines = data.split("\n");
    const text = lines
      .slice(Math.max(line - numLinesContext - 1, 0), line + numLinesContext)
      .join("\n");
    return {
      success: true,
      data: text,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as any).message,
    };
  }
}

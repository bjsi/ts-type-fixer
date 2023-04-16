import * as fs from "fs";
import { z } from "zod";
import { Fail, Success } from "../types/types";

export const get_source_code_at_line_schema = z.object({
  file: z.string(),
  line: z.number(),
  numLinesOfContextBefore: z.number(),
  numLinesOfContextAfter: z.number(),
});

type Args = z.infer<typeof get_source_code_at_line_schema>;

export function get_source_code_at_line(
  args: Args
): Success<string> | Fail<string> {
  const { file, line, numLinesOfContextBefore, numLinesOfContextAfter } = args;
  try {
    const data = fs.readFileSync(file, "utf8");
    const lines = data.split("\n");
    const index = line - 1;
    const startIndex = Math.max(index - numLinesOfContextBefore, 0);
    const endIndex = Math.min(index + numLinesOfContextAfter, lines.length - 1);
    const text = lines
      .slice(startIndex, endIndex + 1)
      .map((lineText, lineIndex) => {
        const lineNum = startIndex + lineIndex + 1;
        return `${lineNum}: ${lineText}`;
      })
      .join("\n");
    return {
      success: true,
      data: `
${text}
...${lines.length - endIndex - 1} lines below...
`.trim(),
    };
  } catch (err) {
    return {
      success: false,
      error: (err as any).message,
    };
  }
}

// console.log(
//   get_source_code_at_line({
//     file: "/home/james/Projects/TS/remnote-new/client/src/js/ui/queue/Queue.tsx",
//     line: 957,
//     numLinesOfContextBefore: 0,
//     numLinesOfContextAfter: 2,
//   })
// );

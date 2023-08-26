import * as fs from "fs";
import { Tool } from "modelfusion";
import { z } from "zod";

export const getSourceCode = new Tool({
  name: "getSourceCode",
  description:
    "Get the source code of a particular line in a file, with some lines of context before and after.",
  inputSchema: z.object({
    file: z.string(),
    line: z.number(),
    numLinesOfContextBefore: z.number(),
    numLinesOfContextAfter: z.number(),
  }),

  execute: async (args) => {
    const { file, line, numLinesOfContextBefore, numLinesOfContextAfter } =
      args;
    try {
      const data = fs.readFileSync(file, "utf8");
      const lines = data.split("\n");
      const index = line - 1;
      const startIndex = Math.max(index - numLinesOfContextBefore, 0);
      const endIndex = Math.min(
        index + numLinesOfContextAfter,
        lines.length - 1
      );
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
...${startIndex} lines above...
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
  },
});

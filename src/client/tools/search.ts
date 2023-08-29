import { exec } from "child_process";
import { Tool } from "modelfusion";
import { promisify } from "util";
import { z } from "zod";
import { projectDir } from "../consts";
const execPromise = promisify(exec);

async function exists(path: string, type: "f" | "d") {
  try {
    return await execPromise(`test -${type} ${path}`);
  } catch (err) {
    return false;
  }
}

export const searchTool = new Tool({
  name: "search",
  description: "Search for a string in a file or directory",
  inputSchema: z.object({
    query: z.string(),
    mode: z.union([z.literal("fuzzy"), z.literal("exact")]),
    file: z.string().optional(),
  }),
  execute: async (args) => {
    try {
      if (args.file && !(await exists(args.file, "f"))) {
        return {
          success: false,
          error:
            "File not found. Please check the path. Did you forget to add the file extension?",
        };
      }

      const exact = `rg -n '${args.query}' ${
        args.file ?? projectDir ?? "."
      } | head -n 21`;
      const fuzzy = `rg -n --glob '*.ts' --glob '*.tsx' . ${
        args.file ?? projectDir ?? "."
      } | fzf --filter "${args.query}" | head -n 21`;
      const { stdout } = await execPromise(
        args.mode === "exact" ? exact : fuzzy
      );
      const data = stdout.trim();
      if (data.length === 0) {
        return {
          success: false,
          error: "No results found",
        };
      } else {
        return {
          success: true,
          data:
            stdout.split("\n").length > 20
              ? stdout.split("\n").slice(0, 20).join("\n") +
                "\n...more results truncated"
              : stdout,
        };
      }
    } catch (err: any) {
      console.log(err);
      return {
        success: false,
        error: err.code === 1 ? "No results found" : (err as any).message,
      };
    }
  },
});

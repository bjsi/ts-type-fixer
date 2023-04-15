import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { Success, Fail } from "../types/types";

export const no_dir_search_schema = z.object({
  query: z.string(),
  mode: z.union([z.literal("fuzzy"), z.literal("exact")]),
  file: z.string().optional(),
});

export const search_file_schema = no_dir_search_schema.merge(
  z.object({
    file: z.string(),
  })
);

export const search_schema = no_dir_search_schema.merge(
  z.object({
    directory: z.string(),
    gitignore: z.string().optional(),
  })
);

export type SearchArgs = z.infer<typeof search_schema>;

export async function search(
  args: SearchArgs
): Promise<Success<string> | Fail<string>> {
  try {
    const execPromise = promisify(exec);
    const exact = `rg -n '${args.query}' ${
      args.file ?? args.directory ?? "."
    } | head -n 21`;
    const fuzzy = `rg -n --glob '*.ts' --glob '*.tsx' . ${
      args.file ?? args.directory ?? "."
    } | fzf --filter "${args.query}" | head -n 21`;
    const { stdout } = await execPromise(args.mode === "exact" ? exact : fuzzy);
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
}

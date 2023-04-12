import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { Success, Fail } from "../types/types";

export const search_code_base_schema = z.object({
  query: z.string(),
});

type Args = z.infer<typeof search_code_base_schema>;

export async function search_code_base(
  args: Args
): Promise<Success<string> | Fail<string>> {
  try {
    const execPromise = promisify(exec);
    const { stdout } = await execPromise(`rg -n '${args.query}' .`);
    return {
      success: true,
      data: stdout,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as any).message,
    };
  }
}

import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { Success, Fail } from "../types/types";

export const list_files_schema = z.object({
  directory: z.string(),
});

// the args the AI sees
export type VisibleListFilesArgs = z.infer<typeof list_files_schema>;

export async function list_files(
  args: VisibleListFilesArgs
): Promise<Success<string> | Fail<string>> {
  try {
    const execPromise = promisify(exec);
    const { stdout } = await execPromise(
      `tree -I node_modules ${args.directory || "."}}`
    );
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

import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

export const task_complete_schema = z.object({
  commit_message: z.string(),
  summary_of_issue: z.string(),
});

export type TaskCompleteArgs = z.infer<typeof task_complete_schema>;

export async function task_complete(args: TaskCompleteArgs): Promise<void> {
  const { commit_message, summary_of_issue } = args;
  const execPromise = promisify(exec);
  const gitCommit = `cd /home/james/Projects/TS/remnote-new/client && git add -A && git commit -m "${commit_message}" -m "${summary_of_issue}"`;
  await execPromise(gitCommit);
  return;
}

import { exec } from "child_process";
import { Tool } from "modelfusion";
import { promisify } from "util";
import { z } from "zod";

export const task_complete_schema = z.object({
  summary_of_issue: z.string(),
});

export const taskComplete = new Tool({
  name: "task_complete",
  description: "Commit and push changes to git",
  inputSchema: task_complete_schema,
  execute: async (args) => {
    const { summary_of_issue } = args;
    const execPromise = promisify(exec);
    const gitCommit = `cd /home/james/Projects/TS/remnote-new/client && git add -A && git commit -m "${summary_of_issue}"`;
    await execPromise(gitCommit);
    return {
      success: true,
      data: "Task completed",
    };
  },
});

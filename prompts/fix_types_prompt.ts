import {
  get_source_code_at_line,
  get_source_code_at_line_schema,
} from "../tools/get_source_code";
import { no_dir_search_schema, search } from "../tools/search";
import {
  get_source_code_for_type_or_interface,
  get_source_code_for_type_or_interface_schema,
} from "../tools/types_interfaces";
import { ChatCompletionRequestMessage } from "openai";
import {
  write_text_to_file,
  write_text_to_file_schema,
} from "../tools/write_file";
import { get_next_type_error } from "../types";
import { getToolArgsString } from "./shared";
import { task_complete, task_complete_schema } from "../tools/task_complete";

export const fixTypesTools = {
  search: {
    run: (args: any) =>
      search({
        ...args,
        directory: "/home/james/Projects/TS/remnote-new/client",
        gitignore: "/home/james/Projects/TS/remnote-new/.gitignore",
      }),
    type: no_dir_search_schema,
  },
  get_source_code_at_line: {
    run: get_source_code_at_line,
    type: get_source_code_at_line_schema,
  },
  get_source_code_for_type_or_interface: {
    run: get_source_code_for_type_or_interface,
    type: get_source_code_for_type_or_interface_schema,
  },
  write_code_in_file: {
    run: write_text_to_file,
    type: write_text_to_file_schema,
  },
  task_complete: {
    run: task_complete,
    type: task_complete_schema,
  },
};

export const fixTypesPrompt: ChatCompletionRequestMessage[] = [
  {
    role: "system",
    content: `
You are fixing type errors in a TypeScript project. You have access to the following actions:

${Object.entries(fixTypesTools)
  .map(([name, tool]) => {
    if (tool.type) {
      const args = getToolArgsString(tool.type);
      return `${name}: (args: ${args}) => string`;
    } else {
      return `${name}`;
    }
  })
  .join("\n")}

Use the following format for each response. All fields are required. Only give one action per response. Assume the type error is not a mistake with the compiler:

Thought: you should always think step-by-step about what to do
Check: you *must* criticise your thought to make sure it's correct
(...Thought and Check may repeat N times)
Action: the action to take
Action Input: the args for the action
`.trim(),
  },
];

export const createTypeErrorObservation = (): ChatCompletionRequestMessage => {
  const typeError = get_next_type_error(
    "/home/james/Projects/TS/remnote-new/client/src/js/ui/queue/Queue.tsx"
  );
  return {
    role: "user",
    content: JSON.stringify({
      "Type error": typeError,
    }),
  };
};

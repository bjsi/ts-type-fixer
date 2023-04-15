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
  write_text_to_file: {
    run: write_text_to_file,
    type: write_text_to_file_schema,
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

Use the following format for each response:

Thought: you should always think step-by-step about what to do
Check: you *must* criticise your thought to make sure it's correct, especially before writing code
Action: the action to take
Action Input: the args for the action
`.trim(),
  },
];

export const createTypeErrorObservation = (): ChatCompletionRequestMessage => {
  const typeError = get_next_type_error();
  return {
    role: "user",
    content: JSON.stringify({
      "Type error": typeError,
    }),
  };
};

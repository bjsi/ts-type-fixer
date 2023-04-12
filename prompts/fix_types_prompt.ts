import * as R from "remeda";
import {
  get_source_code_at_line,
  get_source_code_at_line_schema,
} from "../tools/read_file";
import { search_code_base, search_code_base_schema } from "../tools/search";
import { printNode, zodToTs } from "zod-to-ts";
import { z } from "zod";
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

export const fixTypesTools = {
  search_all_files: {
    run: search_code_base,
    type: search_code_base_schema,
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

const getToolArgsString = (type: z.ZodObject<any>) => {
  const node = zodToTs(type).node;
  const str = printNode(node).replace(/\n/g, " ").replace(/\s+/g, " ");
  return str;
};

export const fixTypesPrompt: ChatCompletionRequestMessage[] = [
  {
    role: "system",
    content: `
Fix the following type errors in a messy typescript codebase. You have access to the following actions:

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
next_type_error: () => void

Use the following format:

Type error: the type error you must fix
Thought: you should always think about what to do
Action: the action to take
...Thought/Action/Criticism may repeat N times
Action Input: the args for the action
Observation: the result of the action
`.trim(),
  },
];

export type ParsedOutputItem =
  | { type: "Thought"; data: string | undefined }
  | { type: "Criticism"; data: string | undefined }
  | { type: "Action"; data: string | undefined }
  | { type: "Action Input"; data: any };

export type ParsedOutput = ParsedOutputItem[];

export function parseText(text: string): ParsedOutput | null {
  let latestMatchIdx = 0;
  let textSection = text;

  const output: ParsedOutput = [];

  while (true) {
    textSection = textSection.slice(latestMatchIdx);

    const updateLatestMatchIdx = (match: RegExpMatchArray) => {
      latestMatchIdx = match.index! + match[1].length;
    };

    const regexes: [RegExp, (match: RegExpMatchArray) => void][] = [
      [
        /Thought: (.+)/,
        (match: RegExpMatchArray) =>
          output.push({ type: "Thought", data: match[1] }),
      ],
      [
        /Criticism: (.+)/,
        (match: RegExpMatchArray) =>
          output.push({ type: "Criticism", data: match[1] }),
      ],
      [
        /Action: (.+)/,
        (match: RegExpMatchArray) =>
          output.push({ type: "Action", data: match[1] }),
      ],
      [
        /Action Input: (\{[^}]+\})/,
        (match: RegExpMatchArray) => {
          const actionInput = JSON.parse(
            match?.[1]?.replace(/(\r\n|\n|\r)/gm, "") || ""
          );
          output.push({ type: "Action Input", data: actionInput });
        },
      ],
    ];

    const matches: [RegExpMatchArray, (match: RegExpMatchArray) => void][] = [];
    for (const [regex, cb] of regexes) {
      const match = textSection.match(regex);
      if (match) {
        matches.push([match, cb]);
      }
    }

    if (matches.length === 0) {
      break;
    } else {
      const [match, cb] = R.sortBy(matches, ([match]) => match.index!)[0];
      cb(match);
      updateLatestMatchIdx(match);
    }
  }

  return output;
}

export function parsedOutputToString(parsedOutput: ParsedOutput): string {
  let result = "";

  for (const item of parsedOutput) {
    switch (item.type) {
      case "Thought":
        result += `Thought: ${item.data}\n`;
        break;
      case "Criticism":
        result += `Criticism: ${item.data}\n`;
        break;
      case "Action":
        result += `Action: ${item.data}\n`;
        break;
      case "Action Input":
        result += `Action Input: ${JSON.stringify(item.data, null, 2)}\n`;
        break;
    }
  }

  return result.trim();
}

export const createTypeErrorObservation = (): ChatCompletionRequestMessage => {
  const typeError = get_next_type_error();
  return {
    role: "user",
    content: JSON.stringify({
      "Type error": typeError,
    }),
  };
};

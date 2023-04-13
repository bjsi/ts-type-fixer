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

Use the following format:

Type error: the type error you must fix
Thought: you should always think step-by-step about what to do
Check: you should always criticise your thought to make sure it's correct
Action: the action to take
Action Input: the args for the action
Observation: the result of the action, provided by the user
`.trim(),
  },
];

export type ParsedOutputItem =
  | { type: "Thought"; data: string | undefined }
  | { type: "Check"; data: string | undefined }
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
        (match: RegExpMatchArray) => {
          output.push({ type: "Thought", data: match[1] });
          updateLatestMatchIdx(match);
        },
      ],
      [
        /Check: (.+)/,
        (match: RegExpMatchArray) => {
          output.push({ type: "Check", data: match[1] });
          updateLatestMatchIdx(match);
        },
      ],
      [
        /Action: (.+)/,
        (match: RegExpMatchArray) => {
          output.push({ type: "Action", data: match[1] });
          updateLatestMatchIdx(match);
        },
      ],
      [
        /Action Input:/,
        (match: RegExpMatchArray) => {
          // couldn't get regex to work because of { } inside the JSON
          const actionInputStartIdx = match.index! + match[0].length;
          const section = textSection.slice(actionInputStartIdx);
          let actionInputEndIdx: number = section.length;
          for (const el of [
            "Thought",
            "Check",
            "Action",
            "Action Input",
            "Observation",
          ]) {
            const idx = section.indexOf(el);
            if (idx !== -1 && idx < actionInputEndIdx) {
              actionInputEndIdx = idx;
            }
          }
          const actionInput = JSON.parse(section.slice(0, actionInputEndIdx));
          output.push({ type: "Action Input", data: actionInput });
          latestMatchIdx = actionInputStartIdx + actionInputEndIdx;
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
      case "Check":
        result += `Check: ${item.data}\n`;
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

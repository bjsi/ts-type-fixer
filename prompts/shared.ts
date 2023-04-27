import { z } from "zod";
import * as R from "remeda";
import { printNode, zodToTs } from "zod-to-ts";

export const getToolArgsString = (type: z.ZodObject<any>) => {
  const node = zodToTs(type).node;
  const str = printNode(node).replace(/\n/g, " ").replace(/\s+/g, " ");
  return str;
};

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
          debugger;
          const section = textSection.slice(actionInputStartIdx);
          let actionInputEndIdx: number = section.length;
          // dumb way to find the end of the JSON
          // what if the JSON has "Thought:" in it etc?
          for (const el of [
            "Thought:",
            "Check:",
            "Action:",
            "Action Input:",
            "Observation:",
          ]) {
            const idx = section.indexOf(el);
            if (idx !== -1 && idx < actionInputEndIdx) {
              actionInputEndIdx = idx;
            }
          }
          debugger;
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

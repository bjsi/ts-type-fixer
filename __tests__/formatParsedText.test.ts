import {
  ParsedOutput,
  parsedOutputToString,
} from "../prompts/fix_types_prompt";

describe("formatParsedText", () => {
  it("formats parsed text", () => {
    const t1: ParsedOutput = [
      {
        type: "Thought",
        data: "I need to find the line of code causing the type error in the file Queue.tsx.",
      },
      { type: "Check", data: "I don't know what to do" },
      { type: "Thought", data: "Something else" },
      { type: "Action", data: "get_source_code_at_line" },
      {
        type: "Action Input",
        data: {
          file: "Queue.tsx",
          line: 982,
          range: 1,
        },
      },
    ];
    const output = parsedOutputToString(t1);
    expect(output).toEqual(
      `Thought: I need to find the line of code causing the type error in the file Queue.tsx.
Check: I don't know what to do
Thought: Something else
Action: get_source_code_at_line
Action Input: {
  "file": "Queue.tsx",
  "line": 982,
  "range": 1
}`.trim()
    );
  });
});

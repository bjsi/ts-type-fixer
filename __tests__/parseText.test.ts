import { parseText } from "../prompts/shared";

describe("parseText", () => {
  it("parses text", () => {
    const t1 = `
Thought: I need to find the line of code causing the type error in the file Queue.tsx.

Action: get_source_code_at_line
Action Input: {"file": "Queue.tsx","line": 982,"range": 1},
Observation: const card = this.getCard()
`.trim();
    const output = parseText(t1);
    expect(output).toEqual([
      {
        type: "Thought",
        data: "I need to find the line of code causing the type error in the file Queue.tsx.",
      },
      { type: "Action", data: "get_source_code_at_line" },
      {
        type: "Action Input",
        data: {
          file: "Queue.tsx",
          line: 982,
          range: 1,
        },
      },
    ]);
  });

  it("parses text", () => {
    const t2 = `
Thought: I need to find the line of code causing the type error in the file Queue.tsx.
Check: I don't know what to do
Thought: Something else
Action: get_source_code_at_line
Action Input: {
"file": "Queue.tsx",
"line": 982,
"range": 1
}`.trim();
    const output = parseText(t2);
    expect(output).toEqual([
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
    ]);
  });
});

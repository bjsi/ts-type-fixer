import { parseText } from "../prompts/shared";

describe("parseText", () => {
  it("parses text", () => {
    const t1 = `
Thought: I need to find the line of code causing the type error in the file Queue.tsx.

Action: get_source_code_at_line
Action Input: {"file": "Queue.tsx","line": 982,"range": 1}
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

  it("parses text", () => {
    const t1 = `
Thought: I see that the error is related to the QueueActionItem component. I need to find the definition of QueueActionItemProps to understand what is required.
Action: get_source_code_for_type_or_interface
Action Input: {
  "names": ["QueueActionItemProps"]
}`.trim();
    const actual = parseText(t1);
    const expected = [
      {
        type: "Thought",

        data: "I see that the error is related to the QueueActionItem component. I need to find the definition of QueueActionItemProps to understand what is required.",
      },
      {
        type: "Action",
        data: "get_source_code_for_type_or_interface",
      },
      {
        type: "Action Input",
        data: {
          names: ["QueueActionItemProps"],
        },
      },
    ];
    expect(actual).toEqual(expected);
  });

  it("sql action input", () => {
    const t = `Action: run_sql
Action Input: { "query": "SELECT COUNT(*) FROM survey WHERE top_four_flashcard_features_to_prioritize LIKE '%AI Flashcard Integrations%'"}`.trim();
    const actual = parseText(t);
    const expected = [
      {
        type: "Action",
        data: "run_sql",
      },
      {
        type: "Action Input",
        data: {
          query:
            "SELECT COUNT(*) FROM survey WHERE top_four_flashcard_features_to_prioritize LIKE '%AI Flashcard Integrations%'",
        },
      },
    ];
    expect(actual).toEqual(expected);
  });

  it("aksjdnk", () => {
    const x =
      `Action Input: { "code": "import pandas as pd\\n# Read the JSON file into a pandas dataframe\\ndf = pd.read_json(\\"data.json\\")\\n# Sort the dataframe by the \\"avg_monthly_searches\\" column in descending order\\ndf_sorted = df.sort_values(\\"avg_monthly_searches\\", ascending=False)\\n# Take the first row to get the keyword with the highest average monthly searches\\nhighest_search_keyword = df_sorted.iloc[0][\\"keyword\\"]\\n# Print the result\\nprint(highest_search_keyword)" }`.trim();
    const actual = parseText(x);

    const expected = [
      {
        type: "Action Input",
        data: {
          code: `import pandas as pd
# Read the JSON file into a pandas dataframe
df = pd.read_json("data.json")
# Sort the dataframe by the "avg_monthly_searches" column in descending order
df_sorted = df.sort_values("avg_monthly_searches", ascending=False)
# Take the first row to get the keyword with the highest average monthly searches
highest_search_keyword = df_sorted.iloc[0]["keyword"]
# Print the result\nprint(highest_search_keyword)
`.trim(),
        },
      },
    ];
    expect(actual).toEqual(expected);
  });
});

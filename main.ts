import { ChatCompletionRequestMessage } from "openai";
import { chat } from "./openai";
import * as R from "remeda";
import { Success, Fail } from "./types/types";
import {
  parseText,
  ParsedOutput,
  parsedOutputToString,
} from "./prompts/shared";
import {
  createTypeErrorObservation,
  fixTypesPrompt,
  fixTypesTools,
} from "./prompts/fix_types_prompt";
import { confirmContinue } from "./getHumanInput";

const callGpt = async (prompt: ChatCompletionRequestMessage[]) => {
  const response = await chat(prompt, false, "gpt-4");
  const msg = response.data.choices[0].message?.content;
  const parsed = msg ? parseText(msg) : undefined;
  return {
    response,
    parsed,
  };
};

export const tryParseJSON = (jsonString: unknown) => {
  try {
    const o = JSON.parse(jsonString as string);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return false;
};

const runAction = async (
  parsed: ParsedOutput
): Promise<Success<string> | Fail<string>> => {
  const action = R.findLast(parsed, (x) => x.type === "Action")?.data;
  if (!action) {
    return {
      success: false,
      error: `
Error: Please provide an action
Action: the action to take
`.trim(),
    };
  }
  const tool = fixTypesTools[action as keyof typeof fixTypesTools];
  if (!tool) {
    return {
      success: false,
      error:
        "Error: No matching action found. Please only use the actions provided.",
    };
  }
  const actionInput = R.findLast(
    parsed,
    (x) => x.type === "Action Input"
  )?.data;
  const schema = tool.type;
  const maybeArgs = schema!.safeParse(actionInput);
  if (!maybeArgs.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  console.log("Running tool", action);
  const output = await tool.run(maybeArgs.data as any);
  const observation = output.success ? output.data : output;
  const ret = JSON.stringify({ Observation: observation }, null, 2);
  console.log("Tool output", ret);
  return {
    success: true,
    data: ret,
  };
};

async function main() {
  let keepGoing = true;

  const firstTypeError = createTypeErrorObservation();

  const prompt: ChatCompletionRequestMessage[] = [
    ...fixTypesPrompt,
    firstTypeError,
  ];

  while (keepGoing) {
    const { parsed } = await callGpt(prompt);
    if (!parsed) {
      console.log("No parsed output from GPT response");
      break;
    }
    parsed.map((x) => {
      console.log(`${x.type}: ${x.data}`);
    });

    prompt.push({
      role: "system",
      content: parsedOutputToString(parsed),
    });

    if (!(await confirmContinue())) {
      break;
    }

    const action = R.findLast(parsed, (x) => x.type === "Action")?.data;
    const actionOutput = await runAction(parsed);
    if (action === "task_complete") {
      console.log("Done!!!");
      break;
    }
    let actionOutputStr = "";
    if (!actionOutput.success) {
      actionOutputStr = actionOutput.error;
    } else {
      actionOutputStr = actionOutput.data;
    }

    prompt.push({
      role: "user",
      content: actionOutputStr,
    });

    console.log("Looping...");
  }

  console.log("Done.");
}

main();

import { ChatCompletionRequestMessage } from "openai";
import * as readline from "readline";
import { chat } from "./openai";
import {
  createTypeErrorObservation,
  fixTypesPrompt,
  fixTypesTools,
  ParsedOutput,
  parsedOutputToString,
  parseText,
} from "./prompts/fix_types_prompt";
import * as R from "remeda";
import { Success, Fail } from "./types/types";

function getInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

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
      error: "No action found",
    };
  }
  const tool = fixTypesTools[action as keyof typeof fixTypesTools];
  if (!tool) {
    return {
      success: false,
      error: "No matching action found",
    };
  }
  const actionInput = R.findLast(
    parsed,
    (x) => x.type === "Action Input"
  )?.data;
  const schema = tool.type;
  const maybeArgs = schema.safeParse(actionInput);
  if (!maybeArgs.success) {
    return {
      success: false,
      error: "Invalid input",
    };
  }

  console.log("Running tool", action);
  const output = await tool.run(maybeArgs.data as any);
  const ret = JSON.stringify({ Observation: output }, null, 2);
  console.log("Tool output", ret);
  return {
    success: true,
    data: ret,
  };
};

async function main() {
  let keepGoing = true;

  const prompt: ChatCompletionRequestMessage[] = [
    ...fixTypesPrompt,
    createTypeErrorObservation(),
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

    const answer = await getInput("Do you want to continue? (y/n) ");
    if (answer.toLowerCase() !== "y") {
      break;
    }

    const actionOutput = await runAction(parsed);
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

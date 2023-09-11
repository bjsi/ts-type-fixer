import { writeFileSync } from "fs";
import {
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  SchemaValidationError,
  useToolOrGenerateText,
} from "modelfusion";
import { omit } from "remeda";
import { findDeclaration } from "./tools/findDeclaration";
import { getSourceCode } from "./tools/getSourceCode";
import { getSourceCodeFor } from "./tools/getSourceCodeFor";
import { searchTool } from "./tools/search";
import { taskComplete } from "./tools/taskComplete";
import { writeTextToFile } from "./tools/writeFile";
import { trpc } from "./trpc";
import path from "path";

const projectRoot = path.resolve(__dirname);

export interface FixNextTypeErrorConfig {
  startFile: string;
  runLoggingEnabled?: boolean;
  modelName?: "gpt-4" | "gpt-3.5-turbo";
}

export const fixNextTypeError = async (config: FixNextTypeErrorConfig) => {
  const messages = [
    OpenAIChatMessage.system(
      `Two expert TypeScript programmers are fixing a type error. ` +
        `Their type error solving strategy is as follows: 1) They read the error context source code thoroughly and note any details that could help solve the type error. ` +
        `2) They debate the next step to take. 3) They agree on a next step and take it. `
    ),
  ];

  const typeErrs = await trpc.getNextTypeErrorInFile.query({
    file: config.startFile,
  });
  if (!typeErrs.success) {
    console.log("Failed to get type errors");
    return;
  }

  const typeErr = typeErrs.data;
  const context = typeErr.source_code;

  messages.push(
    OpenAIChatMessage.user(
      `Error:
${JSON.stringify(omit(typeErr, ["source_code"]), null, 2)}

Please look at the context below and reason about what to do next:

Context:
${context}
`.trim()
    )
  );

  const runId = new Date().toISOString();
  const runLogFile = projectRoot + "/runs/" + runId + ".json";

  while (true) {
    const msgs = JSON.stringify(messages, null, 2);
    console.log(msgs);
    if (config.runLoggingEnabled) {
      writeFileSync(runLogFile, msgs, "utf-8");
    }
    try {
      const { tool, parameters, result, text } = await useToolOrGenerateText(
        new OpenAIChatModel({
          model: config.modelName ?? "gpt-4",
          temperature: 0,
          maxCompletionTokens: 2000,
        }),
        [
          findDeclaration,
          getSourceCode,
          getSourceCodeFor,
          searchTool,
          writeTextToFile,
          taskComplete,
        ],
        OpenAIChatFunctionPrompt.forToolsCurried(messages)
      );

      switch (tool) {
        case null: {
          console.log(`TEXT: ${result}\n`);
          messages.push(OpenAIChatMessage.assistant(text));
          break;
        }
        case "taskComplete":
          console.log(`TASK COMPLETE\n`);
          break;
        default:
          console.log(
            `TOOL: ${tool}\nPARAMETERS: ${JSON.stringify(
              parameters,
              null,
              2
            )}\n`
          );
          messages.push(OpenAIChatMessage.toolCall({ text, tool, parameters }));
          messages.push(OpenAIChatMessage.toolResult({ tool, result }));
      }
    } catch (e) {
      if (e instanceof SchemaValidationError) {
        console.log(`Schema validation error: ${e.message}`);
        messages.push(OpenAIChatMessage.system(e.message));
      }
    }
  }
};

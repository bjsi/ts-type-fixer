import {
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  SchemaValidationError,
  setGlobalFunctionObservers,
  useToolOrGenerateText,
} from "modelfusion";
import dotenv from "dotenv";
import { findDeclaration } from "./tools/findDeclaration";
import { getSourceCode } from "./tools/getSourceCode";
import { getSourceCodeFor } from "./tools/getSourceCodeFor";
import { searchTool } from "./tools/search";
import { taskComplete } from "./tools/taskComplete";
import { writeTextToFile } from "./tools/writeFile";
import { trpc } from "./trpc";
import { loggingObserver } from "./logging";
import { omit } from "remeda";
import path from "path";
import { writeFileSync } from "fs";
const projectRoot = path.resolve(__dirname);

dotenv.config();
setGlobalFunctionObservers([loggingObserver]);

(async () => {
  const messages = [
    OpenAIChatMessage.system(
      `Two expert TypeScript programmers are fixing a type error. ` +
        `Their type error solving strategy is as follows: 1) They read the error context source code thoroughly and note any details that could help solve the type error. ` +
        `2) They debate the next step to take. 3) They agree on a next step and take it. `
    ),
  ];

  const typeErrs = await trpc.getTypeErrorsInFile.query({
    file: "/home/james/Projects/TS/remnote-new/client/src/js/api/component_focus/FocusableComponentContainer.tsx",
  });
  if (!typeErrs.success) {
    console.log("Failed to get type errors");
    return;
  } else if (typeErrs.data.length === 0) {
    console.log("No type errors");
    return;
  }

  const typeErr = typeErrs.data[0];
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
    writeFileSync(runLogFile, msgs, "utf-8");
    try {
      const { tool, parameters, result, text } = await useToolOrGenerateText(
        new OpenAIChatModel({
          model: "gpt-4",
          temperature: 0,
          maxCompletionTokens: 1000,
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
})();

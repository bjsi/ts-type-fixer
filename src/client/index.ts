import {
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
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

dotenv.config();
setGlobalFunctionObservers([loggingObserver]);

(async () => {
  const messages = [
    OpenAIChatMessage.system(
      "You are an expert TypeScript programmer fixing type errors in a codebase. " +
        "Before each problem solving step you must reason step-by-step about what to do next. " +
        "After reasoning, you must choose a tool to help you fix the type error. " +
        "It's always better to pass more parameters to the tool than less because it makes the tool work much faster. "
    ),
  ];

  const typeErr = await trpc.getTypeErrorsInFile.query({
    file: "/home/james/Projects/TS/remnote-new/client/src/js/api/queue/queue.ts",
  });
  if (!typeErr) {
    console.log("No type errors");
    return;
  }

  messages.push(OpenAIChatMessage.user(JSON.stringify(typeErr, null, 2)));

  while (true) {
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
    console.log(JSON.stringify(messages, null, 2));

    switch (tool) {
      case null: {
        console.log(`TEXT: ${result}\n`);
        messages.push(OpenAIChatMessage.assistant(text));
        break;
      }
      default:
        console.log(
          `TOOL: ${tool}\nPARAMETERS: ${JSON.stringify(parameters, null, 2)}\n`
        );
        messages.push(OpenAIChatMessage.toolCall({ text, tool, parameters }));
        messages.push(OpenAIChatMessage.toolResult({ tool, result }));
    }
  }
})();

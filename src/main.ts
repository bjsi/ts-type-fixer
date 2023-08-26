import {
  OpenAIChatFunctionPrompt,
  OpenAIChatMessage,
  OpenAIChatModel,
  useToolOrGenerateText,
} from "modelfusion";
import dotenv from "dotenv";
import { findDeclaration } from "./tools/findDeclaration";
import { getSourceCode } from "./tools/getSourceCode";
import { getSourceCodeFor } from "./tools/getSourceCodeFor";
import { searchTool } from "./tools/search";
import { taskComplete } from "./tools/taskComplete";
import { writeTextToFile } from "./tools/writeFile";
import { getNextTypeError } from "./tools/getTypeErrors";

dotenv.config();

(async () => {
  const messages = [
    OpenAIChatMessage.system(
      "You are an expert TypeScript programmer fixing type errors. You can use one of the tools per problem solving step to help fix the error, but before each problem solving step you must reason step-by-step about what to do next."
    ),
  ];

  while (true) {
    const typeErr = await getNextTypeError(
      "/home/james/Projects/TS/remnote-new/client/src/js/ui/queue/SpacedRepetitionBase.tsx"
    );
    if (!typeErr) {
      console.log("No type errors");
      break;
    }

    messages.push(OpenAIChatMessage.user(JSON.stringify(typeErr, null, 2)));
    const { tool, parameters, result, text } = await useToolOrGenerateText(
      new OpenAIChatModel({
        model: "gpt-4",
        temperature: 0,
        maxCompletionTokens: 500,
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
      default:
        messages.push(OpenAIChatMessage.toolCall({ text, tool, parameters }));
        messages.push(OpenAIChatMessage.toolResult({ tool, result }));
    }
  }
})();

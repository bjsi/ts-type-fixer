import {
  get_source_code_at_line,
  get_source_code_at_line_schema,
} from "../tools/get_source_code";
import { search, search_schema } from "../tools/search";
import { ChatCompletionRequestMessage } from "openai";
import {
  write_text_to_file,
  write_text_to_file_schema,
} from "../tools/write_file";
import { getToolArgsString } from "./shared";
import { list_files, list_files_schema } from "../tools/list_files";
import { read_file, read_file_schema } from "../tools/read_file";

export const writePluginTools = {
  search_code: {
    run: search,
    type: search_schema,
  },
  read_file: {
    run: read_file,
    type: read_file_schema,
  },
  write_text_to_file: {
    run: write_text_to_file,
    type: write_text_to_file_schema,
  },
  get_source_code_at_line: {
    run: get_source_code_at_line,
    type: get_source_code_at_line_schema,
  },
};

export const writePluginPrompt: ChatCompletionRequestMessage[] = [
  {
    role: "system",
    content: `
Your task is to create a plugin for a note taking app called RemNote. You have access to the following actions:

${Object.entries(writePluginTools)
  .map(([name, tool]) => {
    if (tool.type) {
      const args = getToolArgsString(tool.type);
      return `${name}: (args: ${args}) => string`;
    } else {
      return `${name}`;
    }
  })
  .join("\n")}

Use the following format. Only give one action per response:

Thought: you should always think step-by-step about what to do
Check: you should always criticise your thought to make sure it's correct
Action: the action to take
Action Input: the args for the action
`.trim(),
  },
];

export const createPluginInstructions = (): ChatCompletionRequestMessage => {
  return {
    role: "user",
    content: JSON.stringify({
      Instructions: `
Your task is to build a plugin which allows users to import citations from Zotero.
I set up the plugin repository here: /home/james/Projects/TS/remnote-official-plugins/zotero
Note that some of the files already contain some code.

The repo has this structure:
.
├── LICENSE
├── package.json
├── package-lock.json
├── postcss.config.js
├── public
│   └── manifest.json
├── src
│   ├── App.css
│   ├── style.css
│   └── widgets
│       ├── index.tsx
│       └── sample_widget.tsx
├── tailwind.config.js
├── tsconfig.json
└── webpack.config.js

You can look at other people's plugins by searching this directory: /home/james/Projects/TS/remnote-official-plugins

The plugin should do the following:
- Register a setting to store the user's Zotero API key
- Register a zotero command
- The zotero command should use the Zotero API to search for papers by title
- On selecting a paper, import the citation into remnote as a Rem with a bunch of metadata (authors, title, date etc...) stored in powerupProperty slots
- Store the metadata by creating a new powerup called "Zotero" and configure powerup slots for each type of metadata

Suggested problem solving steps:
- think of an action
- search_code of other plugins in fuzzy mode to understand how to implement it
- get_source_code_at_line if you need more context
- before you write code, read the file you're going to write to to make sure you're not overwriting anything
`.trim(),
    }),
  };
};

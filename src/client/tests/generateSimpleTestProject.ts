import * as fs from "fs";

const file =
  "/home/james/Projects/TS/type-fixer/src/client/runs/2023-09-05T13:25:55.784Z.json";
const exampleRun = fs.readFileSync(file, "utf8");

const prompt = `
Look at the history of the interaction between the user and assistant. They were trying to fix a type error in a TypeScript code base. 

Could you generate a very simplified TypeScript repository based on their interaction which can be used to create a test project to test the assistant on the same problem. 
`;

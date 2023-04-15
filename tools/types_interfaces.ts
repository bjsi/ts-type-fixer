import { z } from "zod";
import { InterfaceDeclaration, Project, TypeAliasDeclaration } from "ts-morph";
import { Fail, Success } from "../types/types";

const project = new Project();
project.addSourceFilesAtPaths(
  "/home/james/Projects/TS/remnote-new/client/**/*.ts"
);
project.addSourceFilesAtPaths(
  "/home/james/Projects/TS/remnote-new/client/**/*.tsx"
);

export const get_source_code_for_type_or_interface_schema = z.object({
  names: z.array(z.string()),
});

type Args = z.infer<typeof get_source_code_for_type_or_interface_schema>;

interface TypeOrInterfaceInfo {
  code: string;
  startLine: number;
  endLine: number;
  file: string;
}

export function get_source_code_for_type_or_interface(
  args: Args
): Success<string> | Fail<string> {
  const { names } = args;
  const ret: TypeOrInterfaceInfo[] = [];
  for (const name of names) {
    const typefiles = project
      .getSourceFiles()
      .filter((file) => file.getTypeAlias(name) || file.getInterface(name));
    if (typefiles.length === 0) {
      continue;
    }

    for (const typefile of typefiles) {
      const type = typefile.getTypeAlias(name) || typefile.getInterface(name);
      const addInfo = (type: TypeAliasDeclaration | InterfaceDeclaration) => {
        const lineNumber = type.getStartLineNumber();
        const file = typefile.getFilePath();
        const text = type.getText();
        const code = text
          .split("\n")
          .map((line: string, index: number) => {
            return `${lineNumber + index}: ${line}`;
          })
          .join("\n");
        ret.push({
          code,
          startLine: lineNumber,
          endLine: lineNumber + text.split("\n").length,
          file,
        });
      };

      if (type) {
        addInfo(type);
      }
    }
  }
  if (ret.length > 0) {
    return {
      success: true,
      data: JSON.stringify(ret, null, 2),
    };
  } else {
    return {
      success: false,
      error: "Error: Type or Interface not found.",
    };
  }
}

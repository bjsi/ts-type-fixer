import { z } from "zod";
import { InterfaceDeclaration, Project, TypeAliasDeclaration } from "ts-morph";
import { Fail, Success } from "../types/types";

const project = new Project();
project.addSourceFilesAtPaths(
  "/home/james/Projects/TS/remnote-new/client/**/*.ts"
);

export const get_source_code_for_type_or_interface_schema = z.object({
  names: z.array(z.string()),
});

type Args = z.infer<typeof get_source_code_for_type_or_interface_schema>;

interface TypeOrInterfaceInfo {
  code: string;
  line: number;
  file: string;
}

export function get_source_code_for_type_or_interface(
  args: Args
): Success<string> | Fail<string> {
  const { names } = args;
  const ret: TypeOrInterfaceInfo[] = [];
  for (const name of names) {
    const typefile = project
      .getSourceFiles()
      .find((file) => file.getTypeAlias(name) || file.getInterface(name));
    if (!typefile) {
      continue;
    }
    const type = typefile.getTypeAlias(name);
    const addInfo = (type: TypeAliasDeclaration | InterfaceDeclaration) => {
      const lineNumber = type.getStartLineNumber();
      const file = typefile.getFilePath();
      const text = type.getText();
      console.log(text);
      const code = text
        .split("\n")
        .map((line: string, index: number) => {
          return `${lineNumber + index}: ${line}`;
        })
        .join("\n");
      ret.push({
        code,
        line: lineNumber,
        file,
      });
    };

    if (type) {
      addInfo(type);
    }
    const inter = typefile?.getInterface(name);
    if (inter) {
      addInfo(inter);
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

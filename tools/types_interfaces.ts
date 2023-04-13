import { z } from "zod";
import { Project } from "ts-morph";
import { printNode } from "zod-to-ts";
import { Fail, Success } from "../types/types";

const project = new Project();
project.addSourceFilesAtPaths("**/*.ts");

export const get_source_code_for_type_or_interface_schema = z.object({
  names: z.array(z.string()),
});

type Args = z.infer<typeof get_source_code_for_type_or_interface_schema>;

export function get_source_code_for_type_or_interface(
  args: Args
): Success<string> | Fail<string> {
  const { names } = args;
  const ret: string[] = [];
  for (const name of names) {
    const typefile = project
      .getSourceFiles()
      .find((file) => file.getTypeAlias(name) || file.getInterface(name));
    const type = typefile?.getTypeAlias(name);
    if (type) {
      ret.push(printNode(type.compilerNode));
    }
    const inter = typefile?.getInterface(name);
    if (inter) {
      ret.push(printNode(inter.compilerNode));
    }
  }
  if (ret.length > 0) {
    return {
      success: true,
      data: ret.join("\n\n"),
    };
  } else {
    return {
      success: false,
      error: "Error: Type or Interface not found.",
    };
  }
}

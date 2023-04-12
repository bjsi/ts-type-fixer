import { z } from "zod";
import { Project } from "ts-morph";
import { printNode } from "zod-to-ts";
import { Fail, Success } from "../types/types";

const project = new Project();
project.addSourceFilesAtPaths("**/*.ts");

export const get_source_code_for_type_or_interface_schema = z.object({
  name: z.string(),
});

type Args = z.infer<typeof get_source_code_for_type_or_interface_schema>;

export function get_source_code_for_type_or_interface(
  args: Args
): Success<string> | Fail<string> {
  const { name } = args;
  const typefile = project
    .getSourceFiles()
    .find((file) => file.getTypeAlias(name) || file.getInterface(name));
  const type = typefile?.getTypeAlias(name);
  if (type) {
    return {
      success: true,
      data: printNode(type.compilerNode),
    };
  }
  const inter = typefile?.getInterface(name);
  if (inter) {
    return {
      success: true,
      data: printNode(inter.compilerNode),
    };
  }
  return {
    success: false,
    error: "Error: Type or Interface not found.",
  };
}

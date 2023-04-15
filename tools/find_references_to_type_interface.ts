import { z } from "zod";
import { Project } from "ts-morph";
import { Fail, Success } from "../types/types";

const project = new Project();
project.addSourceFilesAtPaths(
  "/home/james/Projects/TS/remnote-new/client/**/*.ts"
);

export const get_references_for_type_or_interface_schema = z.object({
  name: z.string(),
});

type Args = z.infer<typeof get_references_for_type_or_interface_schema>;

export function get_references_for_type_or_interface(
  args: Args
): Success<string> | Fail<string> {
  const { name } = args;
  const typefile = project
    .getSourceFiles()
    .find(
      (file) =>
        file.getTypeAlias(name) ||
        file.getInterface(name) ||
        file.getClass(name)
    );
  if (!typefile) {
    return {
      success: false,
      error: "Could not find type or interface",
    };
  }
  const type =
    typefile.getTypeAlias(name) ||
    typefile.getInterface(name) ||
    typefile.getClass(name);
  const refs = type?.findReferencesAsNodes();
  if (!refs) {
    return {
      success: false,
      error: "Could not find references to the type or interface",
    };
  }
  const info = refs
    .filter(
      (x) =>
        !x.getParent() || x.getParent()?.getKindName() !== "ImportSpecifier"
    )
    .map((ref) => ({
      line: ref.getStartLineNumber(),
      file: ref.getSourceFile().getFilePath(),
      code: ref.getParent()?.getText() || ref.getText(),
    }));

  if (info.length === 0) {
    return {
      success: false,
      error: "Could not find references to the type or interface",
    };
  }
  const filteredInfo = info.length > 25 ? info.slice(0, 15) : info;
  return {
    success: true,
    data: JSON.stringify(filteredInfo, null, 2),
  };
}

console.log(
  get_references_for_type_or_interface({
    name: "RemId",
  })
);

import { FindDeclarationArgs } from "../../shared/schemas/findDeclaration";
import {
  getDeclarationInfoFromNode,
  getMatchingNodes,
} from "./getMatchingNodes";

export function findDeclaration(args: FindDeclarationArgs) {
  const { name, kind, files } = args;
  console.time("findDeclaration");

  const maybeNodes = getMatchingNodes(
    name,
    typeof kind === "string" ? [kind] : kind,
    files
  );
  if (!maybeNodes.success) {
    return maybeNodes;
  }
  const info = maybeNodes.data.map(getDeclarationInfoFromNode);

  const filteredInfo =
    info.length > 15
      ? info.slice(0, 15) + `\n ${info.length - 15} more...`
      : info;
  console.timeEnd("findDeclaration");
  return {
    success: true,
    data:
      `Note that the codebase may contain unrelated declarations with the same name.\n\n` +
      JSON.stringify(filteredInfo, null, 2),
  };
}

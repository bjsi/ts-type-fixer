import { FindDeclarationArgs } from "../../shared/schemas/findDeclaration";
import { getMatchingNodes, getPositionInfoFromNode } from "./getMatchingNodes";

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
  const info = maybeNodes.data.map(getPositionInfoFromNode);

  const filteredInfo =
    info.length > 15
      ? info.slice(0, 15) + `\n ${info.length - 15} more...`
      : info;
  console.timeEnd("findDeclaration");
  return {
    success: true,
    data: JSON.stringify(filteredInfo, null, 2),
  };
}

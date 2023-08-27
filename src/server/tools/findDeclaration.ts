import { humanReadableKind } from "../../shared/types/types";
import { getMatchingNodes, getPositionInfoFromNode } from "./getMatchingNodes";

export function findDeclaration(args: {
  name: string;
  kind?: (typeof humanReadableKind)[number][];
  files?: string[];
}) {
  const { name, kind, files } = args;
  console.time("findDeclaration");

  const maybeNodes = getMatchingNodes(name, kind || [], files || []);
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

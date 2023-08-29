import { Node, ts } from "ts-morph";
import {
  Fail,
  humanReadableKind,
  humanReadableToSyntaxKind,
  NodeType,
  Success,
  syntaxKindToHumanReadable,
} from "../../shared/types/types";
import { getProjectSourceFiles } from "../tsProject";

export function getPositionInfoFromNode(node: Node) {
  return {
    startLine: node.getStartLineNumber(),
    endLine: node.getEndLineNumber(),
    file: node.getSourceFile().getFilePath(),
    code: node.getText().split("\n")[0],
    // @ts-ignore
    kind: syntaxKindToHumanReadable[node.getKindName()],
  };
}

export function getMatchingNodes(
  name: string,
  kind?: (typeof humanReadableKind)[number][],
  files?: string[]
): Success<Node<ts.Node>[]> | Fail<string> {
  const sourceFiles = getProjectSourceFiles().filter(
    (f) => !files || files?.includes(f.getFilePath())
  );

  const nodesWithMatchingKind = sourceFiles
    .map((f) => {
      const syntaxKinds =
        kind?.map((k) => humanReadableToSyntaxKind[k]).flat() ||
        Object.values(humanReadableToSyntaxKind).flat();
      return f
        .getDescendants()
        .filter((d) => syntaxKinds.some((k) => d.isKind(ts.SyntaxKind[k])));
    })
    .filter((x) => x.length > 0)
    .flat();

  const nodesWithMatchingName = nodesWithMatchingKind.filter(
    (n) => (n as NodeType).getName() === name
  );

  if (nodesWithMatchingName.length === 0) {
    return {
      success: false,
      error: "Could not find that code element.",
    };
  }
  return {
    success: true,
    data: nodesWithMatchingName,
  };
}

import { Node, ts } from "ts-morph";
import * as R from "remeda";
import {
  Fail,
  humanReadableKind,
  humanReadableToSyntaxKind,
  DeclarationNodeType,
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

const getSourceFilesForNodes = (nodes: Node<ts.Node>[]) => {
  const files = nodes.map((n) => n.getSourceFile().getFilePath());
  return R.uniq(R.compact(files));
};

export function getDeclarationInfoFromNode(node: DeclarationNodeType) {
  const references = getSourceFilesForNodes(node.findReferencesAsNodes());
  return {
    ...getPositionInfoFromNode(node),
    references:
      references.length <= 5
        ? references.join("\n")
        : `${references.slice(0, 5).join("\n")}\n${
            references.length - 5
          } more...`,
  };
}

export function getMatchingNodes(
  name: string,
  kind?: (typeof humanReadableKind)[number][],
  files?: string[]
): Success<DeclarationNodeType[]> | Fail<string> {
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
    (n) => (n as DeclarationNodeType).getName() === name
  ) as DeclarationNodeType[];

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

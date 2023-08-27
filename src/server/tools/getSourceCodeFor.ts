import { humanReadableKind, Success, Fail } from "../../shared/types/types";
import { getMatchingNodes, getPositionInfoFromNode } from "./getMatchingNodes";

export function getSourceCodeFor(args: {
  name: string;
  kind: (typeof humanReadableKind)[number];
  file: string;
}):
  | Success<{
      lines: string;
      file: string;
    }>
  | Fail<string> {
  const { name, kind, file } = args;
  const nodes = getMatchingNodes(name, [kind], [file]);
  if (!nodes.success) {
    return nodes;
  } else if (nodes.data.length === 0) {
    return {
      success: false,
      error: "Error: Declaration not found.",
    };
  } else if (nodes.data.length > 1) {
    const text = nodes.data.map(getPositionInfoFromNode);
    return {
      success: false,
      error:
        "Error: Multiple declarations found\n\n" +
        JSON.stringify(text, null, 2),
    };
  } else {
    const node = nodes.data[0];
    const startLine = node.getStartLineNumber();
    const lines = node
      .getText()
      .split("\n")
      .map((text, i) => `${startLine + i}: ${text}`)
      .join("\n");
    return {
      success: true,
      data: {
        lines,
        file: node.getSourceFile().getFilePath(),
      },
    };
  }
}

import { Node, ts } from "ts-morph";

/**
 * WARNING: only works as long as you don't update file content!
 */
export function getNodeId(node: Node<ts.Node>) {
  const unique_id = `${node
    .getSourceFile()
    .getFilePath()}:${node.getStart()}-${node.getEnd()}`;
  return unique_id;
}

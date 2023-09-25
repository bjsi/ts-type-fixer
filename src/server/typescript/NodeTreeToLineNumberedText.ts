import { ts, Node } from "ts-morph";
import { getNodeId } from "./utils";
import * as R from "remeda";

export interface NodeTreeToLineNumberedTextState {
  startNode: Node<ts.Node>;
  currentNode: Node<ts.Node>;
  prevNode: Node<ts.Node> | undefined;
  lastLineNumber: number | undefined;
  text: string;
  skipDescendantsOf: Set<string>;
  stopped: boolean;
}

/**
 * Base class for traversing a node tree and generating a text representation
 * with line numbers.
 *
 * WARNING: only works as long as you don't update file content during traversal!
 */
export abstract class NodeTreeToLineNumberedText {
  name: string;

  protected state: NodeTreeToLineNumberedTextState;

  constructor(args: { startNode: Node<ts.Node> }) {
    this.state = {
      startNode: args.startNode,
      currentNode: args.startNode,
      prevNode: undefined,
      lastLineNumber: undefined,
      text: "",
      skipDescendantsOf: new Set<string>(),
      stopped: false,
    };
  }

  copyStateFrom(
    other: NodeTreeToLineNumberedText,
    stateToCopy: (keyof NodeTreeToLineNumberedTextState)[]
  ) {
    this.state = { ...this.state, ...R.pick(other.state, stateToCopy) };
    return this;
  }

  protected updateAndAppendLineNumber() {
    const lineNumber = this.state.currentNode.getStartLineNumber();
    if (lineNumber !== this.state.lastLineNumber) {
      this.state.text +=
        (this.state.text ? "\n" : "") +
        `${lineNumber}:\t${this.state.currentNode.getIndentationText()}`;
      this.state.lastLineNumber = lineNumber;
    }
  }

  protected appendTextWithLineNumber(node: Node<ts.Node>, text: string) {
    this.updateAndAppendLineNumber();
    const addSpace =
      this.state.prevNode && this.state.prevNode.getEnd() !== node.getStart();
    this.state.text += (addSpace ? " " : "") + text;
  }

  protected toLineNumberedText() {
    const descendants = this.getDescendants();
    for (const child of descendants) {
      this.state.currentNode = child;
      if (this.state.stopped) {
        break;
      } else if (this.handleNode()) {
        this.state.prevNode = child;
        continue;
      } else if (child.getChildren().length > 0) {
        // not leaf node, so skip
        continue;
      } else if (
        child.getFirstAncestor((an) =>
          this.state.skipDescendantsOf.has(getNodeId(an))
        )
      ) {
        continue;
      } else {
        // default handling for a leaf node
        this.updateAndAppendLineNumber();
        const addSpace =
          this.state.prevNode &&
          this.state.prevNode.getEnd() !== child.getStart();
        this.state.text += (addSpace ? " " : "") + child.getText();
        this.state.prevNode = child;
      }
    }
  }

  getDescendants(): Node<ts.Node>[] {
    return R.uniqBy(this.state.startNode.getDescendants(), getNodeId);
  }

  /**
   * Skip all descendants of the current node in the traversal
   */
  skipTraversalOfNodeAndDescendants() {
    this.state.skipDescendantsOf.add(getNodeId(this.state.currentNode));
  }

  /**
   * Stop the traversal
   */
  stopTraversal() {
    this.state.stopped = true;
  }

  getText() {
    this.toLineNumberedText();
    return this.state.text;
  }

  /**
   * Remember to set currentNode, lastNode and to updateLastLineNumber
   * Return true if you handled the node, false otherwise
   */
  abstract handleNode(): boolean;

  subTraverse(traverser: NodeTreeToLineNumberedText) {
    traverser.copyStateFrom(this, ["lastLineNumber", "text", "prevNode"]);
    const text = traverser.getText();
    console.log(traverser.name, "produced", text);
    this.copyStateFrom(traverser, [
      "currentNode",
      "prevNode",
      "lastLineNumber",
      "text",
    ]);
  }
}

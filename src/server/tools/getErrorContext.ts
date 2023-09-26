import { project } from "../tsProject";
import { Fail, fail, success, Success } from "../../shared/types/types";
import { ts, ClassDeclaration, Node } from "ts-morph";
import { TypeErr } from "../../shared/schemas/typeErr";
import { NodeTreeToLineNumberedText } from "../typescript/NodeTreeToLineNumberedText";

class FunctionContext extends NodeTreeToLineNumberedText {
  name = "FunctionContext";
  handleNode(): boolean {
    if (this.state.currentNode.isKind(ts.SyntaxKind.Block)) {
      this.appendTextWithLineNumber(this.state.currentNode, " {");
      this.stopTraversal();
      return true;
    } else {
      return false;
    }
  }
}

class ClassContext extends NodeTreeToLineNumberedText {
  name = "ClassContext";
  handleNode(): boolean {
    const members = (this.state.startNode as ClassDeclaration).getMembers();
    const children = this.state.startNode.getChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      this.state.currentNode = child;
      if (members.some((m) => child.getPos() === m.getPos())) {
        break;
      } else {
        this.appendTextWithLineNumber(child, child.getText());
      }
      this.state.prevNode = child;
    }
    this.stopTraversal();
    return true;
  }
}

class VariableContext extends NodeTreeToLineNumberedText {
  name = "VariableContext";
  handleNode(): boolean {
    if (
      this.state.currentNode.isKind(ts.SyntaxKind.FunctionDeclaration) ||
      this.state.currentNode.isKind(ts.SyntaxKind.ClassDeclaration) ||
      this.state.currentNode.isKind(ts.SyntaxKind.ArrowFunction)
    ) {
      this.subTraverse(
        new FunctionContext({ startNode: this.state.currentNode })
      );
      this.stopTraversal();
      return true;
    } else {
      return false;
    }
  }
}

class HierarchicalErrorContext extends NodeTreeToLineNumberedText {
  name = "HierarchicalErrorContext";
  errorNode: Node<ts.Node>;

  constructor(error: Omit<TypeErr, "context_hierarchy">) {
    const sourceFile = project.getSourceFile(error.file);
    if (!sourceFile) {
      throw new Error(`File not found: ${error.file}`);
    }

    const errorNode = error.pos && sourceFile.getDescendantAtPos(error.pos);
    if (!error.pos || !errorNode) {
      throw new Error(`Error has no position info.`);
    }
    super({ startNode: sourceFile });
    this.errorNode = errorNode;
  }

  override getNodes(): Node<ts.Node>[] {
    const ancestors = this.errorNode.getAncestors();
    const declarationAncestors = ancestors.filter((n) => {
      return (
        n.isKind(ts.SyntaxKind.MethodDeclaration) ||
        n.isKind(ts.SyntaxKind.FunctionDeclaration) ||
        n.isKind(ts.SyntaxKind.ClassDeclaration) ||
        n.isKind(ts.SyntaxKind.VariableStatement) ||
        (n.isKind(ts.SyntaxKind.ArrowFunction) &&
          n.getParent()?.getKind() !== ts.SyntaxKind.VariableDeclaration)
      );
    });

    declarationAncestors.reverse();

    const declarationAncestorPos = declarationAncestors.map((a) => a.getPos());
    const sourceFile = this.errorNode.getSourceFile();
    const sourceFileChildren = sourceFile.getStatements();
    let types: Node<ts.Node>[] = [];
    for (const child of sourceFileChildren) {
      if (declarationAncestorPos.includes(child.getPos())) {
        break;
      } else if (
        child.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
        child.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
        child.isKind(ts.SyntaxKind.EnumDeclaration)
      ) {
        types = types.concat(child.getDescendants());
      }
    }
    return [...types, ...declarationAncestors];
  }

  override getText() {
    this.toLineNumberedText();

    const ancestors = this.errorNode.getAncestors();
    // make sure to include the line of the error node if it's not already included by a declaration ancestor
    if (ancestors.length === 0) {
      this.appendTextWithLineNumber(
        this.errorNode,
        this.errorNode.getSourceFile().getFullText().split("\n")[
          this.errorNode.getStartLineNumber() - 1
        ]
      );
    } else {
      const blockIndex = ancestors.findIndex(
        (n) =>
          n.isKind(ts.SyntaxKind.Block) ||
          n.isKind(ts.SyntaxKind.ClassDeclaration)
      );
      const declIndex = ancestors.findIndex((n) =>
        n.isKind(ts.SyntaxKind.VariableDeclaration)
      );
      if (blockIndex < declIndex) {
        this.appendTextWithLineNumber(
          this.errorNode,
          this.errorNode.getSourceFile().getFullText().split("\n")[
            this.errorNode.getStartLineNumber() - 1
          ]
        );
      }
    }

    return this.state.text;
  }

  handleNode(): boolean {
    if (
      this.state.currentNode.isKind(ts.SyntaxKind.ArrowFunction) ||
      this.state.currentNode.isKind(ts.SyntaxKind.FunctionDeclaration) ||
      this.state.currentNode.isKind(ts.SyntaxKind.MethodDeclaration)
    ) {
      this.subTraverse(
        new FunctionContext({ startNode: this.state.currentNode })
      );
      return true;
    } else if (this.state.currentNode.isKind(ts.SyntaxKind.ClassDeclaration)) {
      this.subTraverse(new ClassContext({ startNode: this.state.currentNode }));
      return true;
    } else if (this.state.currentNode.isKind(ts.SyntaxKind.VariableStatement)) {
      this.subTraverse(
        new VariableContext({ startNode: this.state.currentNode })
      );
      return true;
    } else {
      return false;
    }
  }
}

export function getErrorContextHierarchy(args: {
  error: Omit<TypeErr, "context_hierarchy">;
}): Fail<string> | Success<string> {
  try {
    const ctx = new HierarchicalErrorContext(args.error);
    const text = ctx.getText();
    return success(text);
  } catch (e) {
    return fail((e as any).message);
  }
}

import { project } from "../tsProject";
import { Fail, fail, success, Success } from "../../shared/types/types";
import {
  ts,
  ArrowFunction,
  ClassDeclaration,
  FunctionDeclaration,
  VariableStatement,
} from "ts-morph";
import { TypeErr } from "../../shared/schemas/typeErr";

function getNodeTextWithoutBody(
  node:
    | ArrowFunction
    | VariableStatement
    | ClassDeclaration
    | FunctionDeclaration
): string {
  let text = "";

  if (
    node.isKind(ts.SyntaxKind.ArrowFunction) ||
    node.isKind(ts.SyntaxKind.FunctionDeclaration) ||
    node.isKind(ts.SyntaxKind.ClassDeclaration)
  ) {
    for (const child of node.getChildren()) {
      if (child.isKind(ts.SyntaxKind.Block)) {
        text += " {\n";
        break;
      } else {
        text += child.getText();
      }
    }
  } else if (node.isKind(ts.SyntaxKind.VariableStatement)) {
    text += node.getFlags() & ts.NodeFlags.Let ? "let " : "const ";
    const decList = node.getFirstDescendantByKind(
      ts.SyntaxKind.VariableDeclarationList
    )!;
    const declarations = decList.getDeclarations();
    for (const declaration of declarations) {
      for (const child of declaration.getChildren()) {
        if (
          child.isKind(ts.SyntaxKind.FunctionDeclaration) ||
          child.isKind(ts.SyntaxKind.ClassDeclaration) ||
          child.isKind(ts.SyntaxKind.VariableStatement) ||
          child.isKind(ts.SyntaxKind.ArrowFunction)
        ) {
          text += getNodeTextWithoutBody(child);
        } else {
          text += child.getText();
        }
      }
    }
  }
  return text.trim();
}

export function getErrorContextHierarchy(args: {
  error: Omit<TypeErr, "context_hierarchy">;
}): Fail<string> | Success<string> {
  const { error } = args;
  const sourceFile = project.getSourceFile(args.error.file);
  if (!sourceFile) {
    return fail(`File not found: ${args.error.file}`);
  }

  const errorNode = error.pos && sourceFile.getDescendantAtPos(error.pos);
  if (!error.pos || !errorNode) {
    return fail(`Error has no position info.`);
  }
  const ancestors = errorNode.getAncestors();
  const declarationAncestors = ancestors.filter((n) => {
    return (
      n.isKind(ts.SyntaxKind.FunctionDeclaration) ||
      n.isKind(ts.SyntaxKind.ClassDeclaration) ||
      n.isKind(ts.SyntaxKind.VariableStatement) ||
      (n.isKind(ts.SyntaxKind.ArrowFunction) &&
        n.getParent()?.getKind() !== ts.SyntaxKind.VariableDeclaration)
    );
  }) as (
    | ArrowFunction
    | VariableStatement
    | ClassDeclaration
    | FunctionDeclaration
  )[];

  console.log(declarationAncestors.map((n) => n.getKindName()));

  const contextArr = declarationAncestors.map(getNodeTextWithoutBody).reverse();

  // make sure to include the line of the error node if it's not already included by a declaration ancestor
  if (ancestors.length === 0) {
    contextArr.push(
      sourceFile.getFullText().split("\n")[errorNode.getStartLineNumber() - 1]
    );
  } else {
    const blockIndex = ancestors.findIndex((n) =>
      n.isKind(ts.SyntaxKind.Block)
    );
    const declIndex = ancestors.findIndex((n) =>
      n.isKind(ts.SyntaxKind.VariableDeclaration)
    );
    if (blockIndex < declIndex) {
      contextArr.push(
        sourceFile.getFullText().split("\n")[errorNode.getStartLineNumber() - 1]
      );
    }
  }

  const contextString = contextArr
    .flatMap((x) => ["\n// some lines omitted...\n", x])
    .join("");

  return success(contextString);
}

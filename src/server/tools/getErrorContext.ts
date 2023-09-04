import { project } from "../tsProject";
import { Fail, fail, success, Success } from "../../shared/types/types";
import {
  ts,
  ArrowFunction,
  ClassDeclaration,
  FunctionDeclaration,
  VariableStatement,
  Node,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  EnumDeclaration,
} from "ts-morph";
import { TypeErr } from "../../shared/schemas/typeErr";

const recursivelyFilterChildren = (
  node: Node<ts.Node>,
  predicate: (node: Node<ts.Node>) => boolean
) => {
  let text = "";
  for (const child of node.getChildren()) {
    if (predicate(child)) {
      text += "...\n" + child.getText() + "\n...\n";
      text += recursivelyFilterChildren(child, predicate);
    }
  }
  return text;
};

function getNodeTextWithoutBody(
  node:
    | ArrowFunction
    | VariableStatement
    | ClassDeclaration
    | FunctionDeclaration
    | InterfaceDeclaration
    | TypeAliasDeclaration
    | EnumDeclaration,
  recursivelyFilterChildrenPredicate?: (node: Node<ts.Node>) => boolean
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
        // TODO:
        // if (recursivelyFilterChildrenPredicate) {
        //   text += recursivelyFilterChildren(
        //     child,
        //     recursivelyFilterChildrenPredicate
        //   );
        // }
        break;
      } else {
        const addSpace = child.getKindName().endsWith("Keyword");
        text += addSpace ? " " : "" + child.getText();
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
  } else if (
    node.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
    node.isKind(ts.SyntaxKind.EnumDeclaration)
  ) {
    // for (const child of node.getChildren()) {
    //   if (child.isKind(ts.SyntaxKind.Block)) {
    //     text += " {\n";
    //     if (recursivelyFilterChildrenPredicate) {
    //       text += recursivelyFilterChildren(
    //         child,
    //         recursivelyFilterChildrenPredicate
    //       );
    //     }
    //     text + "\n}\n";
    //     break;
    //   } else {
    text += node.getText();
    // }
  } else if (node.isKind(ts.SyntaxKind.TypeAliasDeclaration)) {
    text += node.getText();
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

  const recursivelyFilterChildrenPredicate = (node: Node<ts.Node>) => {
    return node.getText().includes(errorNode.getText());
  };
  const contextArr = declarationAncestors
    .map((anc) =>
      getNodeTextWithoutBody(anc, recursivelyFilterChildrenPredicate)
    )
    .reverse();

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

  const sourceFileAncestor = ancestors.find((n) =>
    n.isKind(ts.SyntaxKind.SourceFile)
  );

  let contextStr = "";

  // const types = (sourceFile.getDescendantsOfKind(ts.SyntaxKind.InterfaceDeclaration) as (
  //   | InterfaceDeclaration
  //   | TypeAliasDeclaration
  //   | EnumDeclaration
  // )[]
  // )
  //   .concat(
  //     sourceFile.getDescendantsOfKind(ts.SyntaxKind.TypeAliasDeclaration)
  //   )
  //   .concat(sourceFile.getDescendantsOfKind(ts.SyntaxKind.EnumDeclaration))

  //   for (const child of sourceFileChildren) {
  //     if (ancestors.includes(child)) {
  //       console.log("found first ancestor");
  //       break;
  //     } else if (
  //       child.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
  //       child.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
  //       child.isKind(ts.SyntaxKind.EnumDeclaration)
  //     ) {
  //       contextStr += getNodeTextWithoutBody(child) + "\n";
  //     }
  // }

  contextStr += contextArr
    .flatMap((x) => ["\n// some lines omitted...\n", x])
    .join("");

  return success(contextStr);
}

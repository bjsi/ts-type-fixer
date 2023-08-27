import { ts } from "ts-morph";
import { ExtractFileSkeletonArgs } from "../../shared/schemas/extractFileSkeleton";
import { project } from "../tsProject";

// TODO: line numbers - can't seem to get this working
// need the original line numbers pre-transformation
// try srcFile.refreshFromFilesystem
export const extractFileSkeleton = (args: ExtractFileSkeletonArgs) => {
  const { filePath } = args;
  console.time("extractFileSkeleton");
  function removeDuplicateEmptyLines(inputString: string) {
    return inputString.replace(/\n\s*\n/g, "\n");
  }
  const file = project.getSourceFile(filePath);
  if (!file) {
    return {
      success: false,
      error: `No source file found at path: ${filePath}`,
    };
  }

  // Visit each node and transform based on its type
  file.forEachDescendant((node) => {
    if (
      node.isKind(ts.SyntaxKind.FunctionDeclaration) ||
      node.isKind(ts.SyntaxKind.MethodDeclaration) ||
      node.isKind(ts.SyntaxKind.Constructor) ||
      node.isKind(ts.SyntaxKind.ArrowFunction)
    ) {
      const body = node?.getBody();
      if (body && body.isKind(ts.SyntaxKind.Block)) {
        const length = body.getFullText().split("\n").length;
        body.replaceWithText(
          `{
  // ${length} more ${length === 1 ? "line" : "lines"}
}`.trim()
        );
      }
    } else if (node.isKind(ts.SyntaxKind.ClassDeclaration)) {
    } else if (
      node.isKind(ts.SyntaxKind.InterfaceDeclaration) ||
      node.isKind(ts.SyntaxKind.EnumDeclaration)
    ) {
      const interfaceDecl = node;
      const members = interfaceDecl.getMembers();
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (i === 0) {
          member.replaceWithText(
            `// ${members.length} ${
              members.length === 1 ? "member" : "members"
            }`
          );
        } else {
          member.remove();
        }
      }
    } else if (node.isKind(ts.SyntaxKind.ImportDeclaration)) {
      node.remove();
    } else if (
      node.isKind(ts.SyntaxKind.MultiLineCommentTrivia) ||
      (node as any).isKind(ts.SyntaxKind.SingleLineCommentTrivia)
    ) {
      (node as any).remove();
    }
  });

  console.timeEnd("extractFileSkeleton");
  return {
    success: true,
    data: removeDuplicateEmptyLines(file.getFullText()),
  };
};

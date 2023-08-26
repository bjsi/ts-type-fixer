// useful for asking gpt to help with a refactor of a large file
// by removing all the implementation code and leaving only the "skeleton"

import { Tool } from "modelfusion";
import { ts } from "ts-morph";
import { z } from "zod";
import { project } from "./tsProject";

function removeDuplicateEmptyLines(inputString: string) {
  return inputString.replace(/\n\s*\n/g, "\n");
}

// TODO: line numbers - can't seem to get this working
// need the original line numbers pre-transformation
export const extractFileSkeleton = (filePath: string) => {
  console.time("extractFileSkeleton");
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

export const extractFileSkeletonTool = new Tool({
  name: "extractFileSkeleton",
  description:
    "Extract the skeleton of a file listing all functions, classes and types. Useful for getting a high-level overview of a file.",
  inputSchema: z.object({
    filePath: z.string(),
  }),
  execute: async (args) => {
    const { filePath } = args;
    return extractFileSkeleton(filePath);
  },
});

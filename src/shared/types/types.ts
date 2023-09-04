import { ImplementedKindToNodeMappings, ts } from "ts-morph";

export type Success<T> = {
  success: true;
  data: T;
};

export type Fail<E> = {
  success: false;
  error: E;
};

export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const fail = <E>(error: E): Fail<E> => ({
  success: false,
  error,
});

export const humanReadableKind = [
  "function",
  "class",
  "type",
  "enum",
  "variable",
  "parameter",
  "property",
] as const;

export const humanReadableToSyntaxKind = {
  ["function"]: ["FunctionDeclaration"], // TODO: named arrow functions
  ["class"]: ["ClassDeclaration"],
  ["type"]: [
    "InterfaceDeclaration",
    "TypeAliasDeclaration",
    "EnumDeclaration",
    "ClassDeclaration",
  ],
  ["enum"]: ["EnumDeclaration"],
  ["variable"]: ["VariableDeclaration"], // TODO: VariableStatement?
  ["parameter"]: ["Parameter"],
  ["property"]: ["PropertyDeclaration"],
} as const;

export const syntaxKindToHumanReadable = {};
for (const [humanReadable, syntaxKinds] of Object.entries(
  humanReadableToSyntaxKind
)) {
  for (const syntaxKind of syntaxKinds) {
    // @ts-ignore
    if (!syntaxKindToHumanReadable[syntaxKind]) {
      // @ts-ignore
      syntaxKindToHumanReadable[syntaxKind] = [];
    }
    // @ts-ignore
    syntaxKindToHumanReadable[syntaxKind].push(humanReadable);
  }
}

export const declarationSyntaxKinds = Object.values(
  humanReadableToSyntaxKind
).flat();
export type DeclarationSyntaxKinds =
  (typeof ts.SyntaxKind)[(typeof declarationSyntaxKinds)[number]];
export type DeclarationNodeType =
  ImplementedKindToNodeMappings[DeclarationSyntaxKinds];

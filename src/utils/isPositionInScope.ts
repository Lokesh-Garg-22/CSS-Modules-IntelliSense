import type * as vscode from "vscode";
import type * as vsctm from "vscode-textmate";
import getGrammarTokens from "./getGrammarTokens";

export const isCharInScope = (
  tokens: vsctm.IToken[],
  char: number,
  scopePredicate: (scopes: string[]) => boolean
): boolean => {
  for (const token of tokens) {
    if (
      (char >= token.startIndex && char < token.endIndex) ||
      (char === token.endIndex && token === tokens[tokens.length - 1])
    ) {
      return scopePredicate(token.scopes);
    }
  }
  return false;
};

export const isPositionInString = async (
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<boolean> => {
  const tokens = await getGrammarTokens(document, position);
  return isCharInScope(tokens, position.character, (scopes) => {
    if (
      scopes.some((s) => s.includes("string.template")) &&
      scopes.some((s) => s.includes("meta.template.expression"))
    ) {
      return false;
    }
    return scopes.some((s) => s.includes("string"));
  });
};

export const isPositionInComment = async (
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<boolean> => {
  const tokens = await getGrammarTokens(document, position);
  return isCharInScope(tokens, position.character, (scopes) =>
    scopes.some((s) => s.includes("comment"))
  );
};

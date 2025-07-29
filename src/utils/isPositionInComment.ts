import * as vscode from "vscode";
import * as vsctm from "vscode-textmate";
import getGrammarTokens from "./getGrammarTokens";

const isPositionInComment = async (
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<boolean> => {
  let tokens = await getGrammarTokens(document, position);
  return isCharInComment(tokens, position.character);
};

const isCharInComment = (tokens: vsctm.IToken[], char: number): boolean => {
  for (const token of tokens) {
    if (
      (char >= token.startIndex && char < token.endIndex) ||
      (char === token.endIndex && token === tokens[tokens.length - 1])
    ) {
      return token.scopes.some((scope) => scope.includes("comment"));
    }
  }
  return false;
};

export default isPositionInComment;

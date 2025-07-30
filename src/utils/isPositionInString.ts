import * as vscode from "vscode";
import * as vsctm from "vscode-textmate";
import getGrammarTokens from "./getGrammarTokens";

const isPositionInString = async (
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<boolean> => {
  let tokens = await getGrammarTokens(document, position);
  return isCharInString(tokens, position.character);
};

const isCharInString = (tokens: vsctm.IToken[], char: number): boolean => {
  for (const token of tokens) {
    if (
      (char >= token.startIndex && char < token.endIndex) ||
      (char === token.endIndex && token === tokens[tokens.length - 1])
    ) {
      if (
        token.scopes.some((scope) => scope.includes("string.template")) &&
        token.scopes.some((scope) => scope.includes("meta.template.expression"))
      ) {
        return false;
      } else {
        return token.scopes.some((scope) => scope.includes("string"));
      }
    }
  }
  return false;
};

export default isPositionInString;

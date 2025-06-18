import * as vscode from "vscode";
import * as vsctm from "vscode-textmate";
import getGrammar from "./getGrammar";

const isPositionInString = async (
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<boolean> => {
  const grammar = await getGrammar(document);
  if (!grammar) {
    return false;
  }

  let prevState = vsctm.INITIAL;
  let tokens: vsctm.IToken[] = [];
  for (let i = 0; i <= position.line; i++) {
    const lineText = document.lineAt(i).text;
    const tokenized = grammar.tokenizeLine(lineText, prevState);
    prevState = tokenized.ruleStack;
    tokens = tokenized.tokens;
  }

  for (const token of tokens) {
    if (
      position.character >= token.startIndex &&
      position.character < token.endIndex
    ) {
      // Check if token is a string
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

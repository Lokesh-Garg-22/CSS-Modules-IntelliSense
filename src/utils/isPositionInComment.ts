import * as vscode from "vscode";
import * as vsctm from "vscode-textmate";
import getGrammar from "./getGrammar";

const isPositionInComment = async (
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

  for (let id = 0; id < tokens.length; id++) {
    const token = tokens[id];
    if (
      (id === tokens.length - 1 &&
        position.character >= token.startIndex &&
        position.character <= token.endIndex) ||
      (position.character >= token.startIndex &&
        position.character < token.endIndex)
    ) {
      // Check if token is in a Comment
      return token.scopes.some((scope) => scope.includes("comment"));
    }
  }

  return false;
};

export default isPositionInComment;

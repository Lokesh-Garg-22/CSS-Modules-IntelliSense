import * as vscode from "vscode";

export const rangeToString = (range: vscode.Range) => {
  return `[(${range.start.line}, ${range.start.character}), (${range.end.line}, ${range.end.character})]`;
};

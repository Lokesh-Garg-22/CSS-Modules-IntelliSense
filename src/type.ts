import * as vscode from "vscode";

export type ClassNameData = {
  startPosition: vscode.Position;
  endPosition: vscode.Position;
  range: vscode.Range;
  className: string;
  match: RegExpExecArray;
};

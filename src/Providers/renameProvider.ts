import * as vscode from "vscode";
import * as path from "path";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import resolvePath from "../utils/resolvePath";

export default class RenameProvider implements vscode.RenameProvider {
  provideRenameEdits = async (
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ) => {
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    const wordRange = document.getWordRangeAtPosition(
      position,
      /\.[a-zA-Z0-9_-]+/
    );
    if (!wordRange) {
      return;
    }

    const oldClassName = document.getText(wordRange).replace(/^\./, "");
    const filePath = document.uri.fsPath;

    const edit = new vscode.WorkspaceEdit();

    const files = await vscode.workspace.findFiles("**/*.{ts,tsx,js,jsx}");

    await Promise.all(
      files.map(async (file) => {
        const doc = await vscode.workspace.openTextDocument(file);
        const text = doc.getText();
        const importRegex =
          /import\s+(\w+)\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(text))) {
          const varName = match[1];
          const resolvedPath = resolvePath(doc, match[2]);

          if (resolvedPath !== filePath) {
            continue;
          }

          const usageRegex = new RegExp(`${varName}\\.${oldClassName}\\b`, "g");
          let usageMatch: RegExpExecArray | null;

          while ((usageMatch = usageRegex.exec(text))) {
            const index =
              usageMatch.index + usageMatch[0].indexOf(oldClassName);
            const pos = doc.positionAt(index);
            const usageRange = new vscode.Range(
              pos,
              pos.translate(0, oldClassName.length)
            );

            edit.replace(doc.uri, usageRange, newName);
          }
        }
      })
    );

    return edit;
  };

  prepareRename = (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    const wordRange = document.getWordRangeAtPosition(
      position,
      /\.[a-zA-Z0-9_-]+/
    );
    if (wordRange) {
      return new vscode.Range(wordRange.start.translate(0, 1), wordRange.end);
    }
  };
}

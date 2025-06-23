import * as vscode from "vscode";
import * as fs from "fs";
import getResolvedPath from "../utils/getPath";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";

export default class DefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    const wordRange = document.getWordRangeAtPosition(position, /[\w]+/);
    if (!wordRange) {
      return;
    }
    const className = document.getText(wordRange);

    // get the variable name before the dot
    const line = document.lineAt(position).text;
    const prefix = line.substring(0, wordRange.start.character);
    const varMatch = prefix.match(/(\w+)\.$/);
    if (!varMatch) {
      return;
    }

    const varName = varMatch[1];
    const importRegex = new RegExp(
      `import\\s+${varName}\\s+from\\s+['"](.+\\.module\\.(css|scss|less))['"]`
    );
    const fullText = document.getText();
    const imp = fullText.match(importRegex);
    if (!imp) {
      return;
    }

    const cssPath = getResolvedPath(document, imp[1]);
    if (!fs.existsSync(cssPath)) {
      return;
    }

    const cssDoc = await vscode.workspace.openTextDocument(cssPath);
    const text = cssDoc.getText();

    const regex = new RegExp(`\\.${className}\\b`, "g");
    const locations: vscode.LocationLink[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text))) {
      const offset = match.index;
      const pos = cssDoc.positionAt(offset + 1);
      locations.push({
        originSelectionRange: new vscode.Range(wordRange.start, wordRange.end),
        targetUri: cssDoc.uri,
        targetRange: new vscode.Range(
          pos.translate(pos.line <= 0 ? 0 : -1, 0),
          pos.translate(1, 0)
        ),
        targetSelectionRange: new vscode.Range(
          pos,
          pos.translate(0, match[0].length - 1)
        ),
      });
    }

    return locations;
  };
}

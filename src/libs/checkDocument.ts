import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { SUPPORTED_LANGS } from "../config";
import extractClassNames from "../utils/extractClassNames";

const checkDocument = async (
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  if (!SUPPORTED_LANGS.includes(document.languageId)) {
    return;
  }

  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];

  const importRegex =
    /import\s+(\w+)\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(text))) {
    const varName = match[1];
    const importPath = match[2];

    const fullPath = path.resolve(
      path.dirname(document.uri.fsPath),
      importPath
    );
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const definedClasses = await extractClassNames(fullPath);

    const usageRegex = new RegExp(`${varName}\\.([a-zA-Z0-9_]+)`, "g");
    let usageMatch: RegExpExecArray | null;
    while ((usageMatch = usageRegex.exec(text))) {
      const fullMatch = usageMatch[0];
      const className = usageMatch[1];

      // Skip matches inside import statements
      const lineStart = text.lastIndexOf("\n", usageMatch.index) + 1;
      const lineEnd = text.indexOf("\n", usageMatch.index);
      const lineText = text.slice(
        lineStart,
        lineEnd === -1 ? undefined : lineEnd
      );

      if (/^\\s*import\\s+/.test(lineText)) {
        continue;
      }

      if (!definedClasses.includes(className)) {
        const index = usageMatch.index + fullMatch.indexOf(className);
        const pos = document.positionAt(index);
        const range = new vscode.Range(pos, pos.translate(0, className.length));
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Class "${className}" is not defined in ${importPath}`,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }
  }

  diagnosticCollection.set(document.uri, diagnostics);
};

export default checkDocument;

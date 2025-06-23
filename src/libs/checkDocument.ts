import * as vscode from "vscode";
import * as fs from "fs";
import { SUPPORTED_LANGS } from "../config";
import extractClassNames from "../utils/extractClassNames";
import getResolvedPath from "../utils/getPath";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";

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
    const resolvedPath = getResolvedPath(document, importPath);
    if (!fs.existsSync(resolvedPath)) {
      continue;
    }
    const definedClasses = await extractClassNames(resolvedPath);

    const usageRegex = new RegExp(`${varName}\\.([a-zA-Z0-9_]+)`, "g");
    let usageMatch: RegExpExecArray | null;
    while ((usageMatch = usageRegex.exec(text))) {
      const fullMatch = usageMatch[0];
      const className = usageMatch[1];
      const index = usageMatch.index + fullMatch.indexOf(className);
      const pos = document.positionAt(index);

      if (
        (await isPositionInString(document, pos)) ||
        (await isPositionInComment(document, pos))
      ) {
        continue;
      }

      if (!definedClasses.includes(className)) {
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

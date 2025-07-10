import * as vscode from "vscode";
import * as fs from "fs";
import { MESSAGES, SUPPORTED_LANGS } from "../config";
import extractClassNames from "../utils/extractClassNames";
import { resolveImportPathWithAliases } from "../utils/getPath";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

const checkDocument = async (
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  if (!SUPPORTED_LANGS.includes(document.languageId)) {
    return;
  }

  const text = document.getText();
  const diagnostics: vscode.Diagnostic[] = [];

  const importRegex = new RegExp(
    `import\\s+(\\w+)\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
    "g"
  );
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(text))) {
    const varName = match[1];
    const importPath = match[2];
    const resolvedPath = resolveImportPathWithAliases(document, importPath);
    if (!fs.existsSync(resolvedPath)) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(
            document.positionAt(match.index + match[0].indexOf(match[2])),
            document.positionAt(
              match.index + match[0].indexOf(match[2]) + match[2].length
            )
          ),
          MESSAGES.DIAGNOSTIC.CANNOT_FIND_MODULE(match[2]),
          vscode.DiagnosticSeverity.Error
        )
      );
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
            MESSAGES.DIAGNOSTIC.CLASS_NOT_DEFINED(className, importPath),
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }
  }

  diagnosticCollection.set(document.uri, diagnostics);
};

export default checkDocument;

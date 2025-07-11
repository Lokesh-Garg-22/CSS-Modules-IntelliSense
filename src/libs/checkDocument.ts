import * as fs from "fs";
import * as vscode from "vscode";
import { MESSAGES, SUPPORTED_LANGS } from "../config";
import ClassNameCache from "./classNameCache";
import {
  getWorkspaceRelativeImportPath,
  resolveImportPathWithAliases,
} from "../utils/getPath";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

/**
 * Analyzes a given script document to validate usage of CSS Modules.
 *
 * - Checks for valid imports of `.module.css` (and supported extensions).
 * - Verifies that imported class names exist in the corresponding CSS module file.
 * - Skips usages inside strings or comments.
 * - Reports missing imports or undefined class names as diagnostics.
 *
 * @param document - The currently open text document to analyze.
 * @param diagnosticCollection - The diagnostic collection used to report errors and warnings.
 *
 * @returns A promise that resolves when the analysis is complete.
 *
 * @example
 * vscode.workspace.onDidSaveTextDocument((doc) => {
 *   checkDocument(doc, myDiagnosticCollection);
 * });
 */
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
    const definedClasses = await ClassNameCache.getClassNamesFromImportPath(
      getWorkspaceRelativeImportPath(document, importPath)
    );

    const usageRegex = new RegExp(`${varName}\\.([a-zA-Z0-9_]+)`, "g");
    let usageMatch: RegExpExecArray | null;
    while ((usageMatch = usageRegex.exec(text))) {
      const fullMatch = usageMatch[0];
      const className = usageMatch[1];
      const index = usageMatch.index + varName.length + 1;
      const pos = document.positionAt(index);

      if (
        (await isPositionInString(document, pos)) ||
        (await isPositionInComment(document, pos))
      ) {
        continue;
      }

      if (definedClasses && !definedClasses.includes(className)) {
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

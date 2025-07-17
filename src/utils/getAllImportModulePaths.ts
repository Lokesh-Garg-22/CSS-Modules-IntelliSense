import * as vscode from "vscode";
import { getModuleFileRegex } from "./getFileExtensionRegex";
import isPositionInComment from "./isPositionInComment";
import isPositionInString from "./isPositionInString";

/**
 * Extracts all import statements from a VS Code document that import CSS Modules.
 *
 * @param document - The VS Code text document to analyze.
 * @returns An array of RegExp match results, each containing:
 *   - [0] full import statement
 *   - [1] imported variable name
 *   - [2] full module file path
 *   - [3] file extension (e.g., css, scss, less)
 */
const getAllImportModulePaths = async (
  document: vscode.TextDocument
): Promise<RegExpExecArray[]> => {
  const importRegex = new RegExp(
    `import\\s+(\\w+)\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
    "gs"
  );

  const text = document.getText();
  const matches: RegExpExecArray[] = [];

  for (const match of text.matchAll(importRegex)) {
    const startPos = document.positionAt(match.index);
    if (
      (await isPositionInComment(document, startPos)) ||
      (await isPositionInString(document, startPos))
    ) {
      continue;
    }

    matches.push(match);
  }

  return matches;
};

export default getAllImportModulePaths;

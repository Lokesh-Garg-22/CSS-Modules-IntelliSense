import * as vscode from "vscode";
import isPositionInString from "./isPositionInString";
import isPositionInComment from "./isPositionInComment";
import { ClassNameData } from "../type";

/**
 * Extracts all valid usages of CSS Module class names accessed via a given variable name
 * (e.g., `styles.button`) from the provided VS Code document.
 *
 * Skips invalid usages such as:
 * - Nested property chains (`temp.styles.className`)
 * - Occurrences inside strings or comments
 *
 * @param varName - The variable name used to import the CSS module (e.g., "styles")
 * @param document - The text document to search within
 * @returns An array of `ClassNameData` objects containing the matched class names and their ranges
 */
const getAllClassNames = async (
  varName: string,
  document: vscode.TextDocument
): Promise<ClassNameData[]> => {
  const usageRegex = new RegExp(`\\b${varName}\\.([a-zA-Z0-9_]+)\\b`, "g");
  const text = document.getText();
  const matches: ClassNameData[] = [];

  for (const match of text.matchAll(usageRegex)) {
    const className = match[1];
    const pos = document.positionAt(match.index);

    // Skip matches inside strings or comments
    if (
      (await isPositionInString(document, pos)) ||
      (await isPositionInComment(document, pos))
    ) {
      continue;
    }

    // Reject nested usage like temp.styles.class
    if (
      pos.character > 0 &&
      document.lineAt(pos.line).text[pos.character - 1].match(/[.\w]$/)
    ) {
      continue;
    }

    const startPosition = pos.translate(0, varName.length + 1);
    const endPosition = pos.translate(0, varName.length + 1 + className.length);

    matches.push({
      className,
      match,
      startPosition,
      endPosition,
      range: new vscode.Range(startPosition, endPosition),
    });
  }

  return matches;
};

export default getAllClassNames;

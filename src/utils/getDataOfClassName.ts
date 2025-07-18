import * as vscode from "vscode";
import isPositionInString from "./isPositionInString";
import isPositionInComment from "./isPositionInComment";
import { ClassNameData } from "../type";

/**
 * Finds all usages of a specific CSS Module class name in a document, where the usage
 * matches the pattern `varName.className`, excluding:
 * - Occurrences inside strings or comments
 * - Nested or chained access like `temp.styles.className`
 *
 * This function will locate the range for `className` after `varName.`.
 *
 * @param varName - The variable name used for the imported CSS module (e.g., "styles").
 * @param className - The CSS class name to search for (e.g., "button").
 * @param document - The VS Code text document to search within.
 * @returns A list of `ClassNameData` objects containing the matched class names and their ranges.
 */
const getDataOfClassName = async (
  varName: string,
  className: string,
  document: vscode.TextDocument
): Promise<ClassNameData[]> => {
  const usageRegex = new RegExp(`\\b${varName}\\.${className}\\b`, "g");
  const text = document.getText();
  const matches: ClassNameData[] = [];

  for (const match of text.matchAll(usageRegex)) {
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

export default getDataOfClassName;

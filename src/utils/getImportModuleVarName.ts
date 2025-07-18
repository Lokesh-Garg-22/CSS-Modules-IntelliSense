import * as vscode from "vscode";

/**
 * Extracts the variable name used to reference a CSS module import
 * at the given cursor position in a VS Code document.
 *
 * For example, in the expression `styles.button`, this function returns `"styles"`.
 *
 * It only returns a variable name if:
 * - The cursor is after a top-level identifier followed by a dot (e.g., `styles.`)
 * - The pattern is not nested (e.g., it won't match `temp.styles.button`)
 *
 * @param document - The active VS Code text document.
 * @param position - The current cursor position in the document.
 * @returns The variable name before the dot (e.g., "styles"), or `undefined` if not valid.
 */
const getImportModuleVarName = (
  document: vscode.TextDocument,
  position: vscode.Position
): string | undefined => {
  const line = document.lineAt(position).text;
  const prefix = line.substring(0, position.character);

  // Match patterns like "styles.className", but NOT "temp.styles.className"
  const match = prefix.match(/(\w+)\.([\w-]*)$/);
  if (match && typeof match.index !== "undefined") {
    if (match.index > 0 && prefix[match.index - 1].match(/[.\w]$/)) {
      return;
    }

    return match[1]; // Return the module variable name
  }
};

export default getImportModuleVarName;

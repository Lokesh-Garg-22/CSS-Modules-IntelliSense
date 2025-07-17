import * as vscode from "vscode";
import getImportModuleVarName from "./getImportModuleVarName";
import { getModuleFileRegex } from "./getFileExtensionRegex";

/**
 * Retrieves the import path of a CSS Module associated with the variable
 * under the current cursor position.
 *
 * For example, given:
 * ```ts
 * import styles from './styles.module.css';
 * ...
 * <div className={styles.button}></div>
 * ```
 * This function will return `'./styles.module.css'` if the cursor is positioned
 * on or after `styles.`.
 *
 * @param document - The VS Code text document being edited.
 * @param position - The current cursor position.
 * @returns The matched CSS module import path, or `undefined` if not found.
 */
const getImportModulePath = (
  document: vscode.TextDocument,
  position: vscode.Position
): string | undefined => {
  const varName = getImportModuleVarName(document, position);
  if (!varName) {
    return;
  }

  // Match imports like: import styles from './file.module.css'
  const importRegex = new RegExp(
    `import\\s+${varName}\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
    "s"
  );

  const fullText = document.getText();
  const match = fullText.match(importRegex);

  return match?.[1];
};

export default getImportModulePath;

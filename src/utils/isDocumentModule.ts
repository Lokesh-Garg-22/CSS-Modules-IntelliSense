import * as vscode from "vscode";
import { SUPPORTED_MODULE_EXTENSIONS, SUPPORTED_MODULES } from "../config";

/**
 * List of supported module-style file extensions.
 * These typically correspond to CSS preprocessor files using CSS Modules.
 * For example: `styles.module.less`, `theme.module.scss`, etc.
 */
const MODULE_EXTENSIONS = SUPPORTED_MODULE_EXTENSIONS.map(
  (s) => `.module.${s}`
);

/**
 * Checks whether a given VS Code document is a supported module-based style file.
 *
 * A document is considered a "module" if:
 * 1. Its languageId is included in the SUPPORTED_MODULES list.
 * 2. Its file name ends with one of the supported `.module.*` extensions.
 *
 * @param document The VS Code text document to check.
 * @returns `true` if the document is a supported module file, otherwise `false`.
 */
const isDocumentModule = (document: vscode.TextDocument): boolean => {
  return (
    SUPPORTED_MODULES.includes(document.languageId) &&
    MODULE_EXTENSIONS.some((ext) => document.fileName.endsWith(ext))
  );
};

export default isDocumentModule;

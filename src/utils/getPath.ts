import * as vscode from "vscode";
import * as path from "path";
import { CONFIGURATION_KEY, CONFIGURATIONS } from "../config";

// Load alias configuration from workspace settings
const config = vscode.workspace.getConfiguration(CONFIGURATION_KEY);
const aliasMap = config.get<Record<string, string>>(CONFIGURATIONS.ALIASES, {});

/**
 * Resolves an import path by checking configured aliases and falling back to relative resolution from the current document.
 *
 * @param document - The VS Code text document in which the import appears
 * @param importPath - The path from the import statement
 * @returns Absolute path to the resolved file
 */
export const resolveImportPathWithAliases = (
  document: vscode.TextDocument,
  importPath: string
): string => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return "";
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  let resolvedPath = importPath;

  // Replace alias with absolute path if match is found
  for (const [alias, aliasRelativePath] of Object.entries(aliasMap)) {
    if (importPath.startsWith(alias)) {
      const aliasTargetPath = path.join(
        workspaceRoot,
        aliasRelativePath,
        importPath.slice(alias.length)
      );
      resolvedPath = aliasTargetPath;
      break;
    }
  }

  // Resolve path relative to current file if not already absolute
  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.resolve(
      path.dirname(document.uri.fsPath),
      resolvedPath
    );
  }

  return resolvedPath;
};

/**
 * Resolves an absolute path from a given relative import path in the workspace root.
 *
 * @param importPath - A relative path from the root of the workspace
 * @returns The absolute file system path
 */
export const resolveWorkspaceRelativePath = (importPath: string): string => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return "";
  }

  return path.resolve(workspaceFolders[0].uri.fsPath, importPath);
};

/**
 * Converts an import path to a relative path from the workspace root, considering aliases.
 *
 * @param document - The document in which the import appears
 * @param importPath - The import path to convert
 * @returns The relative path from the workspace root
 */
export const getWorkspaceRelativeImportPath = (
  document: vscode.TextDocument,
  importPath: string
): string => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return "";
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const absoluteImportPath = resolveImportPathWithAliases(document, importPath);

  return absoluteImportPath.startsWith(workspaceRoot)
    ? absoluteImportPath.slice(workspaceRoot.length + 1)
    : absoluteImportPath;
};

/**
 * Converts a file URI to a relative path from the workspace root.
 *
 * @param uri - A file URI
 * @returns Relative path from the workspace root
 */
export const getWorkspaceRelativeUriPath = (uri: vscode.Uri): string => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return "";
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const filePath = uri.fsPath;

  return filePath.startsWith(workspaceRoot)
    ? filePath.slice(workspaceRoot.length + 1)
    : filePath;
};

import * as vscode from "vscode";
import * as path from "path";

const config = vscode.workspace.getConfiguration("cssModulesIntellisense");
const aliasMap = config.get<Record<string, string>>("aliases", {});

/**
 * Resolves Path and also checks for aliases
 */
const getResolvedPath = (document: vscode.TextDocument, importPath: string) => {
  let resolvedPath = importPath;

  // Check for alias
  for (const [alias, relPath] of Object.entries(aliasMap)) {
    if (importPath.startsWith(alias)) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return "";
      }

      const basePath = workspaceFolders[0].uri.fsPath;
      const absolute = path.join(
        basePath,
        relPath,
        importPath.slice(alias.length)
      );
      resolvedPath = absolute;
      break;
    }
  }

  // Resolve relative to file if not aliased
  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.resolve(
      path.dirname(document.uri.fsPath),
      resolvedPath
    );
  }

  return resolvedPath;
};

export default getResolvedPath;

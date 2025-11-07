import * as fs from "fs";
import * as vscode from "vscode";
import Cache from "./cache";
import { SUPPORTED_LANGS } from "../config";
import {
  getWorkspaceRelativeImportPath,
  getWorkspaceRelativeUriPath,
  resolveImportPathWithAliases,
} from "../utils/getPath";
import { getAllScriptFiles } from "../utils/getAllFiles";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

export default class CssModuleDependencyCache {
  /**
   * Scans all workspace files and populates the cache with CSS module imports.
   * Uses getAllFiles() to find all source files in the workspace.
   */
  static async populateCacheFromWorkspace() {
    const files = await getAllScriptFiles();
    for (const uri of files) {
      await this.updateCacheForDocument({ uri });
    }

    Cache.saveCache();
  }

  /**
   * Updates the cache for a single document by checking for CSS module imports.
   * Can be used on file save or open events.
   *
   * @param uri - Optional URI if document is not already provided.
   * @param document - TextDocument to analyze.
   */
  static async updateCacheForDocument({
    uri,
    document,
  }: {
    uri?: vscode.Uri;
    document?: vscode.TextDocument;
  }) {
    if (!document && uri) {
      document = await vscode.workspace.openTextDocument(uri);
    }

    if (!document || !SUPPORTED_LANGS.includes(document.languageId)) {
      return;
    }

    const text = document.getText();
    const importRegex = new RegExp(
      `import\\s+[^'"]+\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
      "g"
    );
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(text))) {
      const importPath = match[1];
      const resolvedPath = resolveImportPathWithAliases(document, importPath);
      if (!fs.existsSync(resolvedPath)) {
        continue;
      }

      const relativeImport = getWorkspaceRelativeImportPath(
        document,
        importPath
      );
      const sourceFile = getWorkspaceRelativeUriPath(document.uri);

      let dependents = Cache.modulePathCache.getByKey(relativeImport);
      if (!dependents) {
        dependents = Cache.modulePathCache.createKey(relativeImport);
      }
      dependents.addByKey(sourceFile);
    }

    Cache.saveCache();
  }

  /**
   * Returns all documents that import the given document (by URI).
   * Essentially: reverse lookup of which files depend on this one.
   * @returns Workspace Relative URLs
   */
  static getDependentsForDocument(document: vscode.TextDocument): string[] {
    return (
      Cache.modulePathCache
        .getByKey(getWorkspaceRelativeUriPath(document.uri))
        ?.toKeyArray() || []
    );
  }

  /**
   * Returns a flat list of all files that are registered as dependents
   * of any CSS module in the cache.
   * @returns Workspace Relative URLs
   */
  static getAllDependentDocuments(): string[] {
    return [...Cache.modulePathCache.values()].flatMap((data) =>
      data.toKeyArray()
    );
  }
}

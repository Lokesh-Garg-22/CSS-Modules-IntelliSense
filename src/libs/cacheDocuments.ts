import * as vscode from "vscode";
import * as fs from "fs";
import {
  getWorkspaceRelativeImportPath,
  getWorkspaceRelativeUriPath,
  resolveImportPathWithAliases,
} from "../utils/getPath";
import getAllFiles from "../utils/getAllFiles";
import { SUPPORTED_LANGS } from "../config";

export default class CacheDocuments {
  static cache: Map<string, Set<string>> = new Map();

  private static _context: vscode.ExtensionContext;
  public static get context(): vscode.ExtensionContext {
    return CacheDocuments._context;
  }
  public static set context(value: vscode.ExtensionContext) {
    CacheDocuments._context = value;
  }

  static setup(context: vscode.ExtensionContext) {
    this.context = context;

    this.cacheAllDocuments();
  }

  // TODO
  static loadCache() {}
  static saveCache() {}

  static async cacheAllDocuments() {
    await getAllFiles().then(
      async (files) =>
        await Promise.all(
          files.map(async (uri) => {
            const doc = await vscode.workspace.openTextDocument(uri);
            const text = doc.getText();
            const importRegex =
              /import\s+(\w+)\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;
            let match: RegExpExecArray | null;

            while ((match = importRegex.exec(text))) {
              const importPath = match[2];
              if (
                !fs.existsSync(resolveImportPathWithAliases(doc, importPath))
              ) {
                continue;
              }
              const relativePath = getWorkspaceRelativeImportPath(
                doc,
                importPath
              );

              this.cache.set(
                relativePath,
                (this.cache.get(relativePath) || new Set<string>()).add(
                  getWorkspaceRelativeUriPath(uri)
                )
              );
            }
          })
        )
    );

    this.saveCache();
  }

  static async cacheDocument({
    uri,
    document,
  }: {
    uri?: vscode.Uri;
    document?: vscode.TextDocument;
  }) {
    if (uri) {
      document = await vscode.workspace.openTextDocument(uri);
    } else if (document) {
      uri = document.uri;
    } else {
      return;
    }

    if (!SUPPORTED_LANGS.includes(document.languageId)) {
      return;
    }

    const text = document.getText();
    const importRegex =
      /import\s+(\w+)\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(text))) {
      const importPath = match[2];
      if (!fs.existsSync(resolveImportPathWithAliases(document, importPath))) {
        continue;
      }
      const relativePath = getWorkspaceRelativeImportPath(document, importPath);

      this.cache.set(
        relativePath,
        (this.cache.get(relativePath) || new Set<string>()).add(
          getWorkspaceRelativeUriPath(uri)
        )
      );
    }

    this.saveCache();
  }

  static getDocuments(document: vscode.TextDocument) {
    return [
      ...(this.cache.get(getWorkspaceRelativeUriPath(document.uri)) || []),
    ];
  }
}

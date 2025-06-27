import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  getWorkspaceRelativeImportPath,
  getWorkspaceRelativeUriPath,
  resolveImportPathWithAliases,
} from "../utils/getPath";
import getAllFiles from "../utils/getAllFiles";
import { SUPPORTED_LANGS } from "../config";

const cacheFile = "cache.json";

export default class CssModuleDependencyCache {
  /**
   * Cache mapping from imported CSS module paths (relative to workspace)
   * to the set of document paths that import them.
   */
  static cache: Map<string, Set<string>> = new Map();

  private static _context: vscode.ExtensionContext;
  /**
   * The current extension context.
   */
  public static get context(): vscode.ExtensionContext {
    return CssModuleDependencyCache._context;
  }
  public static set context(value: vscode.ExtensionContext) {
    CssModuleDependencyCache._context = value;
  }

  /**
   * Initializes the cache by loading it from disk and repopulating from workspace files.
   * Should be called once during extension activation.
   */
  static initialize(context: vscode.ExtensionContext) {
    this.context = context;
    const loaded = this.loadCache();
    if (!loaded) {
      this.populateCacheFromWorkspace();
    }
  }

  /**
   * Saves the current cache to a JSON file in the extension’s storage directory.
   * Each key is a CSS module file, and the value is a list of documents that import it.
   */
  static saveCache() {
    if (!this.context.storageUri) {
      return false;
    }

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
    const cacheAsObject: Record<string, string[]> = {};

    for (const [key, valueSet] of this.cache.entries()) {
      cacheAsObject[key] = [...valueSet];
    }

    try {
      fs.mkdirSync(this.context.storageUri.fsPath, { recursive: true });
      fs.writeFileSync(
        cacheFilePath,
        JSON.stringify(cacheAsObject, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error saving CSS Modules cache:", error);
      return false;
    }
    return true;
  }

  /**
   * Loads the cache from a JSON file stored in the extension’s storage directory.
   * If no file exists or loading fails, the cache remains empty.
   */
  static loadCache() {
    if (!this.context.storageUri) {
      return false;
    }

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
    if (!fs.existsSync(cacheFilePath)) {
      return false;
    }

    try {
      const raw = fs.readFileSync(cacheFilePath, "utf-8");
      const parsed: Record<string, string[]> = JSON.parse(raw);

      this.cache = new Map(
        Object.entries(parsed).map(([key, valueArray]) => [
          key,
          new Set(valueArray),
        ])
      );
    } catch (error) {
      console.error("Error loading CSS Modules cache:", error);
      return false;
    }
    return true;
  }

  /**
   * Scans all workspace files and populates the cache with CSS module imports.
   * Uses getAllFiles() to find all source files in the workspace.
   */
  static async populateCacheFromWorkspace() {
    await getAllFiles().then(
      async (files) =>
        await Promise.all(
          files.map(async (uri) => {
            this.updateCacheForDocument({ uri });
          })
        )
    );

    this.saveCache();
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
    const importRegex =
      /import\s+.*?\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;

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

      let dependents = this.cache.get(relativeImport);
      if (!dependents) {
        dependents = new Set<string>();
        this.cache.set(relativeImport, dependents);
      }
      dependents.add(sourceFile);
    }

    this.saveCache();
  }

  /**
   * Returns all documents that import the given document (by URI).
   * Essentially: reverse lookup of which files depend on this one.
   */
  static getDependentsForDocument(document: vscode.TextDocument): string[] {
    return [
      ...(this.cache.get(getWorkspaceRelativeUriPath(document.uri)) || []),
    ];
  }

  /**
   * Returns a flat list of all files that are registered as dependents
   * of any CSS module in the cache.
   */
  static getAllDependentDocuments(): string[] {
    return [...this.cache.values()].flatMap((data) => [...data]);
  }
}

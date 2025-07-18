import * as fs from "fs";
import * as vscode from "vscode";
import safeParser from "postcss-safe-parser";
import selectorParser from "postcss-selector-parser";
import Cache, { ClassNameData, ClassNameDataMap } from "./cache";
import {
  getWorkspaceRelativeUriPath,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import { DEBOUNCE_TIMER, SUPPORTED_MODULES } from "../config";
import isPositionInComment from "../utils/isPositionInComment";
import CssModuleDependencyCache from "./cssModuleDependencyCache";
import CheckDocument from "./checkDocument";

/**
 * A utility class to extract and cache class names from CSS Module files.
 */
export default class ClassNameCache {
  /**
   * A map to track debounce timers for each CSS module path.
   * Used to avoid frequent cache updates on rapid file edits.
   */
  protected static ClassNameCacheDebounceIdMap: Record<string, NodeJS.Timeout> =
    {};

  /**
   * Triggers a debounced update of class name cache for the given document.
   * Also triggers a refresh on dependent documents.
   *
   * @param e The text document to update the class name cache for.
   */
  static async updateClassNameCache(e: vscode.TextDocument) {
    const importPath = getWorkspaceRelativeUriPath(e.uri);
    clearTimeout(this.ClassNameCacheDebounceIdMap[importPath]);
    this.ClassNameCacheDebounceIdMap[importPath] = setTimeout(async () => {
      await ClassNameCache.extractFromUri(e.uri);

      if (SUPPORTED_MODULES.includes(e.languageId)) {
        const dependents = CssModuleDependencyCache.getDependentsForDocument(e);

        for (const workspacePath of dependents) {
          const resolvedPath = resolveWorkspaceRelativePath(workspacePath);
          if (!resolvedPath) {
            return;
          }
          const document = await vscode.workspace.openTextDocument(
            resolvedPath
          );
          CheckDocument.push(document);
        }
      }
    }, DEBOUNCE_TIMER.UPDATE_CLASS_NAME);
  }

  /**
   * Checks if the given class name exists in the CSS module associated with a document or URI.
   *
   * @param className The class name to check.
   * @param document Text document to resolve the URI.
   * @param uri URI of the CSS module.
   * @returns A promise resolving to true if the class exists, false if not, or undefined if no valid URI is provided.
   */
  static async hasClassName({
    className,
    document,
    uri,
  }: {
    className: string;
    document?: vscode.TextDocument;
    uri?: vscode.Uri;
  }) {
    if (!uri && document) {
      uri = document.uri;
    }
    if (!uri) {
      return;
    }

    const importPath = getWorkspaceRelativeUriPath(uri);
    return await this.hasClassNameFromImportPath(className, importPath);
  }

  /**
   * Checks if the given class name exists in the cached CSS module identified by import path.
   *
   * @param className The class name to check.
   * @param importPath The workspace-relative path to the CSS module file.
   * @returns A promise resolving to true if the class exists, or false if not.
   */
  static async hasClassNameFromImportPath(
    className: string,
    importPath: string
  ): Promise<boolean | undefined> {
    if (Cache.classNameCache.hasByKey(importPath)) {
      return Cache.classNameCache.getByKey(importPath)?.has(className);
    } else {
      return (await this.extractAndCacheClassNames(importPath))?.has(className);
    }
  }

  /**
   * Retrieves metadata (such as range) for a class name from a document or URI.
   *
   * @param className The class name to retrieve data for.
   * @param document Text document.
   * @param uri URI to locate the module file.
   * @returns An array of `ClassNameData` for the class, or undefined if not found.
   */
  static async getClassNameData({
    className,
    document,
    uri,
  }: {
    className: string;
    document?: vscode.TextDocument;
    uri?: vscode.Uri;
  }) {
    if (!uri && document) {
      uri = document.uri;
    }
    if (!uri) {
      return;
    }

    const importPath = getWorkspaceRelativeUriPath(uri);
    return await this.getClassNameDataFromImportPath(className, importPath);
  }

  /**
   * Retrieves metadata (such as range) for a class name from a specific import path.
   *
   * @param className The class name to retrieve data for.
   * @param importPath The workspace-relative path to the CSS module file.
   * @returns An array of `ClassNameData`, or undefined if not found or unsupported.
   */
  static async getClassNameDataFromImportPath(
    className: string,
    importPath: string
  ): Promise<ClassNameData[] | undefined> {
    if (Cache.classNameCache.hasByKey(importPath)) {
      return Cache.classNameCache.getByKey(importPath)?.get(className);
    } else {
      return (await this.extractAndCacheClassNames(importPath))?.get(className);
    }
  }

  /**
   * Retrieves all class names from a document or URI.
   *
   * @param document Text document.
   * @param uri URI of the CSS module file.
   * @returns An array of class names, or undefined if not supported.
   */
  static async getClassNames({
    document,
    uri,
  }: {
    document?: vscode.TextDocument;
    uri?: vscode.Uri;
  }) {
    if (!uri && document) {
      uri = document.uri;
    }
    if (!uri) {
      return;
    }

    const importPath = getWorkspaceRelativeUriPath(uri);
    return await this.getClassNamesFromImportPath(importPath);
  }

  /**
   * Retrieves all class names from a given import path.
   *
   * @param importPath The workspace-relative path to the CSS module.
   * @returns An array of class names, or undefined if the file is not supported.
   */
  static async getClassNamesFromImportPath(
    importPath: string
  ): Promise<string[] | undefined> {
    if (Cache.classNameCache.hasByKey(importPath)) {
      return Array.from(
        Cache.classNameCache.getByKey(importPath)?.keys() || []
      );
    } else {
      return Array.from(
        (await this.extractAndCacheClassNames(importPath))?.keys() || []
      );
    }
  }

  /**
   * Extracts and caches class names from a URI.
   *
   * @param uri The URI of the CSS Module file.
   */
  static async extractFromUri(uri: vscode.Uri): Promise<undefined> {
    const importPath = getWorkspaceRelativeUriPath(uri);
    await this.extractAndCacheClassNames(importPath);
  }

  /**
   * Parses and extracts class names from a CSS/LESS/SCSS module file,
   * then caches the result internally.
   *
   * @param importPath The workspace-relative import path of the module file.
   * @returns A map of class names to metadata, or undefined if the file is invalid or not supported.
   */
  static async extractAndCacheClassNames(
    importPath: string
  ): Promise<ClassNameDataMap | undefined> {
    const filePath = resolveWorkspaceRelativePath(importPath);
    if (!fs.existsSync(filePath)) {
      Cache.classNameCache.deleteByKey(importPath); // Clean up stale entries
      return;
    }

    const document = await vscode.workspace.openTextDocument(filePath);
    if (!document || !SUPPORTED_MODULES.includes(document.languageId)) {
      return;
    }

    const content = document.getText();
    const root = safeParser(content);
    const classNames = new ClassNameDataMap();
    const rules: Parameters<Parameters<(typeof root)["walkRules"]>[0]>[0][] =
      [];

    const handleRule = async (
      rule: Parameters<Parameters<(typeof root)["walkRules"]>[0]>[0]
    ) => {
      const selector = rule.selector;
      const ruleStart = rule.source?.start;

      if (!selector || !ruleStart) {
        return;
      }

      if (
        await isPositionInComment(
          document,
          new vscode.Position(ruleStart.line - 1, ruleStart.column - 1)
        )
      ) {
        return;
      }

      selectorParser((selectors) => {
        selectors.walkClasses((classNode) => {
          const { value, sourceIndex } = classNode;

          // Compute position in the document
          const selectorOffsetInDoc =
            document.offsetAt(
              new vscode.Position(ruleStart.line - 1, ruleStart.column - 1)
            ) + sourceIndex;

          const data: ClassNameData = {
            range: new vscode.Range(
              document.positionAt(selectorOffsetInDoc),
              document.positionAt(selectorOffsetInDoc + value.length + 1) // +1 for "."
            ),
          };

          classNames.add(value, data);
        });
      }).processSync(selector);
    };

    root.walkRules((rule) => {
      rules.push(rule);
    });

    for (const rule of rules) {
      await handleRule(rule);
    }

    Cache.classNameCache.setByKey(importPath, classNames);
    Cache.saveCache();
    return classNames;
  }
}

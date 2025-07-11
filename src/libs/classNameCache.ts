import * as fs from "fs";
import * as vscode from "vscode";
import safeParser from "postcss-safe-parser";
import Cache from "./cache";
import {
  getWorkspaceRelativeUriPath,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import { SUPPORTED_MODULES } from "../config";
import { getAllModuleFiles } from "../utils/getAllFiles";
import isPositionInComment from "../utils/isPositionInComment";

/**
 * A utility class to extract and cache class names from CSS Module files.
 */
export default class ClassNameCache {
  /**
   * Initializes the class name cache by loading from disk or scanning workspace files.
   */
  static initialize() {
    const loaded = Cache.loadCache();
    if (!loaded) {
      this.populateCacheFromWorkspace();
    }
  }

  /**
   * Scans all CSS Module files in the workspace and populates the class name cache.
   */
  static async populateCacheFromWorkspace() {
    const files = await getAllModuleFiles();
    await Promise.all(files.map((uri) => this.extractFromUri(uri)));

    Cache.saveCache();
  }

  /**
   * Retrieves class names from the given document or URI, checking the cache first.
   * @param param0 Object containing a `vscode.TextDocument` or `vscode.Uri`.
   * @returns An array of class names, or undefined if invalid or not found.
   */
  static async getClassNames({
    document,
    uri,
  }: {
    document?: vscode.TextDocument;
    uri?: vscode.Uri;
  }): Promise<string[] | undefined> {
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
   * Retrieves class names from a given import path, checking the cache first.
   * @param importPath The relative path to the module file.
   * @returns An array of class names, or undefined if the file is not supported.
   */
  static async getClassNamesFromImportPath(
    importPath: string
  ): Promise<string[] | undefined> {
    if (Cache.classNameCache.has(importPath)) {
      return [...(Cache.classNameCache.get(importPath) || [])];
    } else {
      return await this.extractAndCacheClassNames(importPath);
    }
  }

  /**
   * Loads and parses class names from the given file URI and stores them in the cache.
   * @param uri The URI of the CSS Module file.
   */
  static async extractFromUri(uri: vscode.Uri): Promise<undefined> {
    const importPath = getWorkspaceRelativeUriPath(uri);
    await this.extractAndCacheClassNames(importPath);
  }

  /**
   * Parses and extracts class names from a CSS/LESS/SCSS module file, then caches the result.
   * @param importPath The workspace-relative import path of the module file.
   * @returns A list of class names, or undefined if the file is invalid or not supported.
   */
  static async extractAndCacheClassNames(
    importPath: string
  ): Promise<string[] | undefined> {
    const filePath = resolveWorkspaceRelativePath(importPath);
    if (!fs.existsSync(filePath)) {
      Cache.classNameCache.delete(importPath); // Clean up stale entries
      return;
    }

    const document = await vscode.workspace.openTextDocument(filePath);
    if (!document || !SUPPORTED_MODULES.includes(document.languageId)) {
      return;
    }

    const content = document.getText();
    const root = safeParser(content);
    const classNames = new Set<string>();
    const walkPromises: Promise<void>[] = [];

    const handleRule = async (
      rule: Parameters<Parameters<(typeof root)["walkRules"]>[0]>[0]
    ) => {
      if (rule.source?.start) {
        const position = new vscode.Position(
          rule.source.start.line - 1,
          rule.source.start.column - 1
        );
        const isCommented = await isPositionInComment(document, position);
        if (isCommented) {
          return;
        }
      }

      const matches = rule.selector.match(/\.(\w[\w-]*)/g);
      matches?.forEach((m) => classNames.add(m.slice(1)));
    };

    root.walkRules((rule) => {
      walkPromises.push(handleRule(rule));
    });

    await Promise.all(walkPromises);

    Cache.classNameCache.set(importPath, classNames);
    Cache.saveCache();
    return Array.from(classNames);
  }
}

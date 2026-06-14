import * as fs from "fs";
import * as vscode from "vscode";
import {
  DEBOUNCE_TIMER,
  MAX_CHECK_DOCUMENT_QUEUE_LENGTH,
  MESSAGES,
  SUPPORTED_LANGS,
  SUPPORTED_MODULES,
} from "../config";
import {
  getWorkspaceRelativeImportPath,
  getWorkspaceRelativeUriPath,
  resolveImportPathWithAliases,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import {
  getClassNotDefinedEnabled,
  getClassNotDefinedSeverity,
  getClassNotUsedEnabled,
  getClassNotUsedSeverity,
} from "./vsConfig";
import getAllClassNames from "../utils/getAllClassNames";
import getAllImportModulePaths from "../utils/getAllImportModulePaths";
import ClassNameCache from "./classNameCache";
import CssModuleDependencyCache from "./cssModuleDependencyCache";

/**
 * Class responsible for analyzing script documents to validate usage of CSS Modules.
 *
 * This class:
 * - Detects valid imports of `.module.css` (or supported extensions).
 * - Verifies class names used in code are defined in the corresponding CSS Module.
 * - Skips analysis within comments or strings.
 * - Collects and pushes diagnostics to VSCode's problems panel.
 *
 * @example
 * CheckDocument.diagnosticCollection = myDiagnosticCollection;
 * CheckDocument.push(doc);
 */
export default class CheckDocument {
  private static _diagnosticCollection: vscode.DiagnosticCollection;

  /**
   * Collection used to store and report diagnostics.
   */
  public static get diagnosticCollection(): vscode.DiagnosticCollection {
    return this._diagnosticCollection;
  }

  public static set diagnosticCollection(value: vscode.DiagnosticCollection) {
    this._diagnosticCollection = value;
  }

  /**
   * Timer ID used for debounced document checking.
   */
  protected static debounceTimerId: NodeJS.Timeout;

  /**
   * Queue of documents pending analysis.
   */
  protected static documentQueue: Array<vscode.TextDocument> = [];

  /**
   * Adds a document to the check queue and starts the analysis if idle.
   *
   * @param document - The text document to analyze.
   * @returns The new queue length.
   */
  static push(document: vscode.TextDocument): number {
    if (this.isQueueEmpty()) {
      const length = this.documentQueue.push(document);
      this.checkNextDocument().catch(console.error);
      return length;
    }
    while (this.documentQueue.length >= MAX_CHECK_DOCUMENT_QUEUE_LENGTH) {
      this.documentQueue.shift();
    }
    return this.documentQueue.push(document);
  }

  /**
   * Removes the last document from the queue.
   */
  static pop(): vscode.TextDocument | undefined {
    return this.documentQueue.pop();
  }

  /**
   * Returns the next document to be analyzed without removing it from the queue.
   */
  static peek(): vscode.TextDocument | undefined {
    if (this.documentQueue.length <= 0) {
      return;
    }
    return this.documentQueue[this.documentQueue.length - 1];
  }

  /**
   * Returns whether the document queue is empty.
   */
  static isQueueEmpty(): boolean {
    return this.documentQueue.length <= 0;
  }

  /**
   * Clears the entire document queue.
   */
  static clear(): typeof CheckDocument {
    while (this.documentQueue.length) {
      this.pop();
    }
    return this;
  }

  /**
   * Sets a debounce timer to delay document analysis.
   */
  static setDebounceTimer(): void {
    clearTimeout(this.debounceTimerId);
    this.debounceTimerId = setTimeout(() => {
      this.checkNextDocument().catch(console.error);
    }, DEBOUNCE_TIMER.CHECK_DOCUMENT);
  }

  /**
   * Checks the next document in the queue.
   */
  static async checkNextDocument(): Promise<void> {
    const document = this.peek();
    if (document) {
      await this.analyzeDocument(document);
      this.pop();
      this.setDebounceTimer();
    }
  }

  /**
   * Routes the document to the appropriate analyzer based on language.
   *
   * @param document - The text document to analyze.
   */
  private static async analyzeDocument(
    document: vscode.TextDocument
  ): Promise<void> {
    if (SUPPORTED_LANGS.includes(document.languageId)) {
      await this.analyzeScriptDocument(document);
    } else if (SUPPORTED_MODULES.includes(document.languageId)) {
      await this.analyzeModuleDocument(document);
    }
  }

  /**
   * Analyzes a JS/TS document for correct CSS Module usage.
   *
   * @param document - The text document to analyze.
   */
  private static async analyzeScriptDocument(
    document: vscode.TextDocument
  ): Promise<void> {
    const classNotDefinedEnabled = getClassNotDefinedEnabled();
    const classNotDefinedSeverity = getClassNotDefinedSeverity();
    const diagnostics: vscode.Diagnostic[] = [];
    const importMatches = await getAllImportModulePaths(document);

    await Promise.all(
      importMatches.map(async (importMatch) => {
        const [importLine, importVar, importPath] = importMatch;

        const resolvedPath = resolveImportPathWithAliases(document, importPath);
        if (!fs.existsSync(resolvedPath)) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(
                document.positionAt(
                  importMatch.index + importLine.indexOf(importPath)
                ),
                document.positionAt(
                  importMatch.index +
                    importLine.indexOf(importPath) +
                    importPath.length
                )
              ),
              MESSAGES.DIAGNOSTIC.CANNOT_FIND_MODULE(importPath),
              vscode.DiagnosticSeverity.Error
            )
          );
          return;
        }

        const classNamesData = await getAllClassNames(importVar, document);

        if (classNotDefinedEnabled) {
          for (const classNameData of classNamesData) {
            const className = classNameData.className;

            if (
              !(await ClassNameCache.hasClassNameFromImportPath(
                className,
                getWorkspaceRelativeImportPath(document, importPath)
              ))
            ) {
              diagnostics.push(
                new vscode.Diagnostic(
                  classNameData.range,
                  MESSAGES.DIAGNOSTIC.CLASS_NOT_DEFINED(className, importPath),
                  classNotDefinedSeverity
                )
              );
            }
          }
        }
      })
    );

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Analyzes a CSS module document for unused class names.
   *
   * @param document - The CSS module text document to analyze.
   */
  private static async analyzeModuleDocument(
    document: vscode.TextDocument
  ): Promise<void> {
    const classNotUsedEnabled = getClassNotUsedEnabled();
    const classNotUsedSeverity = getClassNotUsedSeverity();
    const diagnostics: vscode.Diagnostic[] = [];

    if (classNotUsedEnabled) {
      const definedClasses = await ClassNameCache.getClassNames({ document });
      const dependents =
        CssModuleDependencyCache.getDependentsForDocument(document);
      const moduleImportPath = getWorkspaceRelativeUriPath(document.uri);

      const usedClasses = new Set<string>();
      await Promise.all(
        dependents.map(async (workspacePath) => {
          const resolvedPath = resolveWorkspaceRelativePath(workspacePath);
          if (!resolvedPath) {
            return;
          }
          const depDoc = await vscode.workspace.openTextDocument(resolvedPath);
          const imports = await getAllImportModulePaths(depDoc);
          for (const [, importVar, importPath] of imports) {
            if (
              getWorkspaceRelativeImportPath(depDoc, importPath) ===
              moduleImportPath
            ) {
              const classNamesData = await getAllClassNames(importVar, depDoc);
              classNamesData.forEach((c) => usedClasses.add(c.className));
            }
          }
        })
      );

      for (const className of definedClasses ?? []) {
        if (!usedClasses.has(className)) {
          const ranges = await ClassNameCache.getClassNameData({
            document,
            className,
          });
          for (const { range } of ranges ?? []) {
            diagnostics.push(
              new vscode.Diagnostic(
                range,
                MESSAGES.DIAGNOSTIC.CLASS_NOT_USED(className),
                classNotUsedSeverity
              )
            );
          }
        }
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }
}

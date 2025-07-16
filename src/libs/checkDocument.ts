import * as fs from "fs";
import * as vscode from "vscode";
import { DEBOUNCE_TIMER, MESSAGES, SUPPORTED_LANGS } from "../config";
import ClassNameCache from "./classNameCache";
import {
  getWorkspaceRelativeImportPath,
  resolveImportPathWithAliases,
} from "../utils/getPath";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

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
      this.checkNextDocument();
      return length;
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
      this.checkNextDocument();
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
   * Analyzes the given document for correct CSS Module usage.
   *
   * @param document - The text document to analyze.
   */
  private static async analyzeDocument(
    document: vscode.TextDocument
  ): Promise<void> {
    if (!SUPPORTED_LANGS.includes(document.languageId)) {
      return;
    }

    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    const importRegex = new RegExp(
      `import\\s+(\\w+)\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
      "g"
    );

    let importMatch: RegExpExecArray | null;
    while ((importMatch = importRegex.exec(text))) {
      const [_, importVar, importPath] = importMatch;

      const startPos = document.positionAt(importMatch.index);
      if (
        (await isPositionInComment(document, startPos)) ||
        (await isPositionInString(document, startPos))
      ) {
        continue;
      }

      const resolvedPath = resolveImportPathWithAliases(document, importPath);
      if (!fs.existsSync(resolvedPath)) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(
              document.positionAt(
                importMatch.index + importMatch[0].indexOf(importPath)
              ),
              document.positionAt(
                importMatch.index +
                  importMatch[0].indexOf(importPath) +
                  importPath.length
              )
            ),
            MESSAGES.DIAGNOSTIC.CANNOT_FIND_MODULE(importPath),
            vscode.DiagnosticSeverity.Error
          )
        );
        continue;
      }

      const definedClassNames =
        await ClassNameCache.getClassNamesFromImportPath(
          getWorkspaceRelativeImportPath(document, importPath)
        );

      const usageRegex = new RegExp(`${importVar}\\.([a-zA-Z0-9_]+)`, "g");
      let usageMatch: RegExpExecArray | null;
      while ((usageMatch = usageRegex.exec(text))) {
        const className = usageMatch[1];
        const classStartIndex = usageMatch.index + importVar.length + 1;
        const classPos = document.positionAt(classStartIndex);

        if (
          (await isPositionInString(document, classPos)) ||
          (await isPositionInComment(document, classPos))
        ) {
          continue;
        }

        if (!definedClassNames?.includes(className)) {
          const range = new vscode.Range(
            classPos,
            classPos.translate(0, className.length)
          );
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              MESSAGES.DIAGNOSTIC.CLASS_NOT_DEFINED(className, importPath),
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }
}

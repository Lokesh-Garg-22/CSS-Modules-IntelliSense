import * as vscode from "vscode";
import * as fs from "fs";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import {
  resolveImportPathWithAliases,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import extractClassNames from "../utils/extractClassNames";
import CssModuleDependencyCache from "../libs/cssModuleDependencyCache";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

export class ScriptsRenameProvider implements vscode.RenameProvider {
  provideRenameEdits = async (
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string
  ) => {
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    if (!wordRange) {
      return;
    }

    const oldClassName = document.getText(wordRange);
    const lineText = document.lineAt(position).text;
    const prefix = lineText.slice(0, wordRange.start.character);
    const varName = prefix.match(/(\w+)\.$/)?.[1];
    if (!varName) {
      return;
    }

    const fullText = document.getText();
    // Match imports like: import styles from './file.module.css'
    const importRegex = new RegExp(
      `import\\s+${varName}\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`
    );
    const importMatch = importRegex.exec(fullText);
    if (!importMatch) {
      return;
    }

    const cssFilePath = resolveImportPathWithAliases(document, importMatch[1]);
    if (!fs.existsSync(cssFilePath)) {
      return;
    }

    const cssDoc = await vscode.workspace.openTextDocument(cssFilePath);
    const edit = new vscode.WorkspaceEdit();
    const dependentFiles =
      CssModuleDependencyCache.getDependentsForDocument(cssDoc);

    // Update all dependent JavaScript/TypeScript files
    await Promise.all(
      dependentFiles.map(async (file) => {
        const doc = await vscode.workspace.openTextDocument(
          resolveWorkspaceRelativePath(file)
        );
        const text = doc.getText();
        const importRegex = new RegExp(
          `import\\s+(\\w+)\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
          "g"
        );
        const matches = [...text.matchAll(importRegex)];

        for (const match of matches) {
          const localVar = match[1];
          const resolvedPath = resolveImportPathWithAliases(doc, match[2]);
          if (resolvedPath !== cssFilePath) {
            continue;
          }

          const usageRegex = new RegExp(
            `${localVar}\\.${oldClassName}\\b`,
            "g"
          );
          for (const usageMatch of text.matchAll(usageRegex)) {
            const index =
              usageMatch.index! + usageMatch[0].indexOf(oldClassName);
            const pos = doc.positionAt(index);

            if (
              (await isPositionInString(doc, pos)) ||
              (await isPositionInComment(doc, pos))
            ) {
              continue;
            }

            const usageRange = new vscode.Range(
              pos,
              pos.translate(0, oldClassName.length)
            );

            edit.replace(doc.uri, usageRange, newName);
          }
        }
      })
    );

    // Update the Css Module File
    const cssText = cssDoc.getText();
    const classNameRegex = new RegExp(`\\.${oldClassName}\\b`, "g");
    for (const match of cssText.matchAll(classNameRegex)) {
      const offset = match.index;
      const pos = cssDoc.positionAt(offset + 1); // +1 to skip the `.`
      const usageRange = new vscode.Range(
        pos,
        pos.translate(0, oldClassName.length)
      );

      edit.replace(cssDoc.uri, usageRange, newName);
    }

    return edit;
  };

  prepareRename = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    if (!wordRange) {
      return;
    }

    const className = document.getText(wordRange);
    const lineText = document.lineAt(position).text;

    // Extract the variable before the dot
    const prefix = lineText.slice(0, wordRange.start.character);
    const varName = prefix.match(/(\w+)\.$/)?.[1];
    if (!varName) {
      return;
    }

    const fullText = document.getText();
    // Match imports like: import styles from './file.module.css'
    const moduleRegex = new RegExp(
      `import\\s+${varName}\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`
    );
    const importMatch = moduleRegex.exec(fullText);
    if (!importMatch) {
      return;
    }

    const cssPath = resolveImportPathWithAliases(document, importMatch[1]);
    if (!fs.existsSync(cssPath)) {
      return;
    }

    const classNames = await extractClassNames(cssPath);
    return classNames.includes(className) ? wordRange : undefined;
  };
}

export class ModulesRenameProvider implements vscode.RenameProvider {
  provideRenameEdits = async (
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string
  ) => {
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    const wordRange = document.getWordRangeAtPosition(
      position,
      /\.[a-zA-Z0-9_-]+/
    );
    if (!wordRange) {
      return;
    }

    const oldClassName = document.getText(wordRange).replace(/^\./, "");
    const filePath = document.uri.fsPath;

    const edit = new vscode.WorkspaceEdit();

    const files = CssModuleDependencyCache.getDependentsForDocument(document);

    // Update all the Javascript Files
    await Promise.all(
      files.map(async (file) => {
        const doc = await vscode.workspace.openTextDocument(
          resolveWorkspaceRelativePath(file)
        );
        const text = doc.getText();
        const importRegex = new RegExp(
          `import\\s+(\\w+)\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
          "g"
        );
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(text))) {
          const varName = match[1];
          const resolvedPath = resolveImportPathWithAliases(doc, match[2]);

          if (resolvedPath !== filePath) {
            continue;
          }

          const usageRegex = new RegExp(`${varName}\\.${oldClassName}\\b`, "g");
          let usageMatch: RegExpExecArray | null;

          while ((usageMatch = usageRegex.exec(text))) {
            const index =
              usageMatch.index + usageMatch[0].indexOf(oldClassName);
            const pos = doc.positionAt(index);

            if (
              (await isPositionInString(doc, pos)) ||
              (await isPositionInComment(doc, pos))
            ) {
              continue;
            }

            const usageRange = new vscode.Range(
              pos,
              pos.translate(0, oldClassName.length)
            );

            edit.replace(doc.uri, usageRange, newName);
          }
        }
      })
    );

    // Update the Css Module File
    const text = document.getText();
    const classNameRegex = new RegExp(`\\.${oldClassName}\\b`, "g");
    let match: RegExpExecArray | null;

    while ((match = classNameRegex.exec(text))) {
      const offset = match.index;
      const pos = document.positionAt(offset + 1);
      const usageRange = new vscode.Range(
        pos,
        pos.translate(0, oldClassName.length)
      );

      edit.replace(document.uri, usageRange, newName);
    }

    return edit;
  };

  prepareRename = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    const wordRange = document.getWordRangeAtPosition(
      position,
      /\.[a-zA-Z0-9_-]+/
    );

    if (!wordRange) {
      return;
    }
    const className = document.getText(wordRange).replace(/^\./, "");
    const classNames = await extractClassNames(document.uri.path);

    if (classNames.includes(className)) {
      return new vscode.Range(wordRange.start.translate(0, 1), wordRange.end);
    }
  };
}

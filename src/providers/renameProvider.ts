import * as vscode from "vscode";
import * as fs from "fs";
import ClassNameCache from "../libs/classNameCache";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import {
  getWorkspaceRelativeImportPath,
  resolveImportPathWithAliases,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import CssModuleDependencyCache from "../libs/cssModuleDependencyCache";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

const provideRenameEdits = async ({
  document,
  oldClassName,
  newName,
}: {
  document: vscode.TextDocument;
  oldClassName: string;
  newName: string;
}) => {
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
          const index = usageMatch.index + usageMatch[0].indexOf(oldClassName);
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
  const classNameData = await ClassNameCache.getClassNameData({
    className: oldClassName,
    document,
  });
  if (classNameData) {
    classNameData.forEach((data) => {
      edit.replace(
        document.uri,
        new vscode.Range(data.range.start.translate(0, 1), data.range.end),
        newName
      );
    });
  }

  return edit;
};

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

    return await provideRenameEdits({
      document: cssDoc,
      oldClassName,
      newName,
    });
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

    return (await ClassNameCache.hasClassNameFromImportPath(
      className,
      getWorkspaceRelativeImportPath(document, importMatch[1])
    ))
      ? wordRange
      : undefined;
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

    return await provideRenameEdits({ document, oldClassName, newName });
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

    if (await ClassNameCache.hasClassName({ className, document })) {
      return new vscode.Range(wordRange.start.translate(0, 1), wordRange.end);
    }
  };
}

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
import isDocumentModule from "../utils/isDocumentModule";
import getAllImportModulePaths from "../utils/getAllImportModulePaths";
import getImportModulePath from "../utils/getImportModulePath";
import getDataOfClassName from "../utils/getDataOfClassName";

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
  for (const file of files) {
    const doc = await vscode.workspace.openTextDocument(
      resolveWorkspaceRelativePath(file)
    );
    const matches = await getAllImportModulePaths(doc);

    for (const match of matches) {
      const varName = match[1];
      const resolvedPath = resolveImportPathWithAliases(doc, match[2]);

      if (resolvedPath !== filePath) {
        return;
      }

      const classNamePositions = await getDataOfClassName(
        varName,
        oldClassName,
        doc
      );

      classNamePositions.forEach((classNamePosition) => {
        edit.replace(doc.uri, classNamePosition.range, newName);
      });
    }
  }

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
    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    if (!wordRange) {
      return;
    }

    const oldClassName = document.getText(wordRange);
    const importModulePath = await getImportModulePath(document, position);
    if (!importModulePath) {
      return;
    }

    const cssFilePath = resolveImportPathWithAliases(
      document,
      importModulePath
    );
    if (!fs.existsSync(cssFilePath)) {
      return;
    }

    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
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
    const importModulePath = await getImportModulePath(document, position);
    if (!importModulePath) {
      return;
    }

    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    return (await ClassNameCache.hasClassNameFromImportPath(
      className,
      getWorkspaceRelativeImportPath(document, importModulePath)
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
    const wordRange = document.getWordRangeAtPosition(
      position,
      /\.[a-zA-Z0-9_-]+/
    );
    if (!wordRange) {
      return;
    }

    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position)) ||
      !isDocumentModule(document)
    ) {
      return;
    }

    const oldClassName = document.getText(wordRange).replace(/^\./, "");

    return await provideRenameEdits({ document, oldClassName, newName });
  };

  prepareRename = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position)) ||
      !isDocumentModule(document)
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
    const className = document.getText(wordRange).replace(/^\./, "");

    if (await ClassNameCache.hasClassName({ className, document })) {
      return new vscode.Range(wordRange.start.translate(0, 1), wordRange.end);
    }
  };
}

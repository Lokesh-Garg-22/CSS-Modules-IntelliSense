import * as vscode from "vscode";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import {
  resolveImportPathWithAliases,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import extractClassNames from "../utils/extractClassNames";
import CssModuleDependencyCache from "../libs/cssModuleDependencyCache";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

// TODO only works for the css module files, make a separate one for the script files
export default class ModulesRenameProvider implements vscode.RenameProvider {
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

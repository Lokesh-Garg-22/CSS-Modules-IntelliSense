import * as vscode from "vscode";
import * as fs from "fs";
import {
  resolveImportPathWithAliases,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import CssModuleDependencyCache from "../libs/cssModuleDependencyCache";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

export class ScriptDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.LocationLink[] | undefined> => {
    // Skip strings and comments early
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

    const className = document.getText(wordRange);
    const lineText = document.lineAt(position).text;

    // Extract the variable before the dot
    const prefix = lineText.slice(0, wordRange.start.character);
    const varMatch = /(\w+)\.$/.exec(prefix);
    if (!varMatch) {
      return;
    }

    const varName = varMatch[1];
    const fullText = document.getText();

    // Match imports like: import styles from './file.module.css'
    const importRegex = new RegExp(
      `import\\s+${varName}\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`
    );
    const importMatch = importRegex.exec(fullText);
    if (!importMatch) {
      return;
    }

    const cssPath = resolveImportPathWithAliases(document, importMatch[1]);
    if (!fs.existsSync(cssPath)) {
      return;
    }

    const cssDoc = await vscode.workspace.openTextDocument(cssPath);
    const cssText = cssDoc.getText();

    const locations: vscode.LocationLink[] = [];
    const classRegex = new RegExp(`\\.${className}\\b`, "g");

    let match: RegExpExecArray | null;
    while ((match = classRegex.exec(cssText))) {
      const offset = match.index;
      const pos = cssDoc.positionAt(offset + 1); // +1 to skip '.'

      locations.push({
        originSelectionRange: new vscode.Range(wordRange.start, wordRange.end),
        targetUri: cssDoc.uri,
        targetRange: new vscode.Range(
          pos.translate(pos.line <= 0 ? 0 : -1, 0),
          pos.translate(1, 0)
        ),
        targetSelectionRange: new vscode.Range(
          pos,
          pos.translate(0, match[0].length - 1)
        ),
      });
    }

    return locations.length > 0 ? locations : undefined;
  };
}

export class ModuleDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition = async (
    cssDoc: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.LocationLink[] | undefined> => {
    if (
      (await isPositionInString(cssDoc, position)) ||
      (await isPositionInComment(cssDoc, position))
    ) {
      return;
    }

    const wordRange = cssDoc.getWordRangeAtPosition(position, /\.[\w]+/);
    if (!wordRange) {
      return;
    }

    const className = cssDoc.getText(wordRange).slice(1); // remove leading dot
    const cssPath = resolveImportPathWithAliases(cssDoc, cssDoc.uri.path);
    if (!fs.existsSync(cssPath)) {
      return;
    }

    const locations: vscode.LocationLink[] = [];
    const cssText = cssDoc.getText();
    const classRegex = new RegExp(`\\.${className}\\b`, "g");

    // Add definitions in the current CSS module
    let match: RegExpExecArray | null;
    while ((match = classRegex.exec(cssText))) {
      const offset = match.index;
      const pos = cssDoc.positionAt(offset + 1); // skip '.'

      locations.push({
        originSelectionRange: new vscode.Range(wordRange.start, wordRange.end),
        targetUri: cssDoc.uri,
        targetRange: new vscode.Range(
          pos.translate(pos.line <= 0 ? 0 : -1, 0),
          pos.translate(1, 0)
        ),
        targetSelectionRange: new vscode.Range(
          pos,
          pos.translate(0, className.length)
        ),
      });
    }

    // Add usages from dependent files
    const dependents =
      CssModuleDependencyCache.getDependentsForDocument(cssDoc);
    await Promise.all(
      dependents.map(async (filePath) => {
        const doc = await vscode.workspace.openTextDocument(
          resolveWorkspaceRelativePath(filePath)
        );
        const docText = doc.getText();

        const importRegex = new RegExp(
          `import\\s+(\\w+)\\s+from\\s+['"]([^'"]+\\.module\\.(${getModuleFileRegex()}))['"]`,
          "g"
        );
        let importMatch: RegExpExecArray | null;

        while ((importMatch = importRegex.exec(docText))) {
          const [_, varName, importPath] = importMatch;
          const resolvedPath = resolveImportPathWithAliases(doc, importPath);
          if (resolvedPath !== cssPath) {
            continue;
          }

          const usageRegex = new RegExp(`${varName}\\.${className}\\b`, "g");
          let usageMatch: RegExpExecArray | null;

          while ((usageMatch = usageRegex.exec(docText))) {
            const index = usageMatch.index + usageMatch[0].indexOf(className);
            const pos = doc.positionAt(index);

            if (
              (await isPositionInString(doc, pos)) ||
              (await isPositionInComment(doc, pos))
            ) {
              continue;
            }

            locations.push({
              originSelectionRange: new vscode.Range(
                wordRange.start,
                wordRange.end
              ),
              targetUri: doc.uri,
              targetRange: new vscode.Range(
                pos.translate(pos.line <= 0 ? 0 : -1, 0),
                pos.translate(1, 0)
              ),
              targetSelectionRange: new vscode.Range(
                pos,
                pos.translate(0, className.length)
              ),
            });
          }
        }
      })
    );

    return locations.length > 0 ? locations : undefined;
  };
}

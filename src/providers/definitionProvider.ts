import * as fs from "fs";
import * as vscode from "vscode";
import {
  resolveImportPathWithAliases,
  resolveWorkspaceRelativePath,
} from "../utils/getPath";
import isDocumentModule from "../utils/isDocumentModule";
import getDataOfClassName from "../utils/getDataOfClassName";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import getImportModulePath from "../utils/getImportModulePath";
import getAllImportModulePaths from "../utils/getAllImportModulePaths";
import CssModuleDependencyCache from "../libs/cssModuleDependencyCache";
import ClassNameCache from "../libs/classNameCache";

const definitionProviderForModules = async (
  cssDoc: vscode.TextDocument,
  locations: vscode.LocationLink[],
  className: string,
  originSelectionRange: vscode.Range
) => {
  const classNamesData = await ClassNameCache.getClassNameData({
    className,
    document: cssDoc,
  });

  classNamesData?.forEach((classNameData) => {
    locations.push({
      originSelectionRange,
      targetUri: cssDoc.uri,
      targetRange: new vscode.Range(
        classNameData.range.start.line <= 0
          ? classNameData.range.start.translate(
              0,
              -classNameData.range.start.character
            )
          : classNameData.range.start.translate(-1, 0),
        classNameData.range.start.translate(1, 0)
      ),
      targetSelectionRange: classNameData.range,
    });
  });
};

export class ScriptDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.LocationLink[] | undefined> => {
    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    if (!wordRange) {
      return;
    }

    const className = document.getText(wordRange);
    const importModulePath = await getImportModulePath(document, position);
    if (!importModulePath) {
      return;
    }

    const cssPath = resolveImportPathWithAliases(document, importModulePath);
    if (!fs.existsSync(cssPath)) {
      return;
    }

    // Skip strings and comments
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    const cssDoc = await vscode.workspace.openTextDocument(cssPath);
    const locations: vscode.LocationLink[] = [];

    await definitionProviderForModules(
      cssDoc,
      locations,
      className,
      new vscode.Range(wordRange.start, wordRange.end)
    );

    return locations.length > 0 ? locations : undefined;
  };
}

export class ModuleDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition = async (
    cssDoc: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.LocationLink[] | undefined> => {
    const wordRange = cssDoc.getWordRangeAtPosition(position, /\.[\w-]+/);
    if (!wordRange) {
      return;
    }

    const className = cssDoc.getText(wordRange).slice(1); // remove leading dot
    const cssPath = resolveImportPathWithAliases(cssDoc, cssDoc.uri.path);
    if (!fs.existsSync(cssPath)) {
      return;
    }

    if (
      (await isPositionInString(cssDoc, position)) ||
      (await isPositionInComment(cssDoc, position)) ||
      !isDocumentModule(cssDoc)
    ) {
      return;
    }

    const locations: vscode.LocationLink[] = [];

    // Add definitions in the current CSS module
    await definitionProviderForModules(
      cssDoc,
      locations,
      className,
      new vscode.Range(wordRange.start, wordRange.end)
    );

    // Add usages from dependent files
    const dependents =
      CssModuleDependencyCache.getDependentsForDocument(cssDoc);
    for (const filePath of dependents) {
      const doc = await vscode.workspace.openTextDocument(
        resolveWorkspaceRelativePath(filePath)
      );
      const importMatches = await getAllImportModulePaths(doc);

      await Promise.all(
        importMatches.map(async (importMatch) => {
          const [_, varName, importPath] = importMatch;
          const resolvedPath = resolveImportPathWithAliases(doc, importPath);
          if (resolvedPath !== cssPath) {
            return;
          }

          const positions = await getDataOfClassName(varName, className, doc);
          for (const positionData of positions) {
            locations.push({
              originSelectionRange: new vscode.Range(
                wordRange.start,
                wordRange.end
              ),
              targetUri: doc.uri,
              targetRange: new vscode.Range(
                positionData.startPosition.line <= 0
                  ? positionData.startPosition.translate(
                      0,
                      -positionData.startPosition.character
                    )
                  : positionData.startPosition.translate(-1, 0),
                positionData.startPosition.translate(1, 0)
              ),
              targetSelectionRange: positionData.range,
            });
          }
        })
      );
    }

    return locations.length > 0 ? locations : undefined;
  };
}

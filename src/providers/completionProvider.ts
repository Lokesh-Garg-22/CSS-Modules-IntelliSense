import * as vscode from "vscode";
import { MESSAGES } from "../config";
import ClassNameCache from "../libs/classNameCache";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import { getWorkspaceRelativeImportPath } from "../utils/getPath";
import getImportModulePath from "../utils/getImportModulePath";

export default class CompletionItemProvider
  implements vscode.CompletionItemProvider
{
  static config = vscode.workspace.getConfiguration("cssModulesIntellisense");
  static aliasMap = CompletionItemProvider.config.get<Record<string, string>>(
    "aliases",
    {}
  );

  provideCompletionItems = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
      return;
    }

    const importModulePath = getImportModulePath(document, position);
    if (!importModulePath) {
      return;
    }

    const classNames = await ClassNameCache.getClassNamesFromImportPath(
      getWorkspaceRelativeImportPath(document, importModulePath)
    );
    if (!classNames) {
      return;
    }
    return new vscode.CompletionList(
      classNames.map((name) => {
        const item = new vscode.CompletionItem(
          name,
          vscode.CompletionItemKind.Variable
        );
        item.detail = MESSAGES.COMPLETION.CSS_MODULE_CLASS;
        return item;
      }),
      false
    );
  };
}

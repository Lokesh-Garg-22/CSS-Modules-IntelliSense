import * as vscode from "vscode";
import { CONFIGURATION_KEY, CONFIGURATIONS, MESSAGES } from "../config";
import ClassNameCache from "../libs/classNameCache";
import isPositionInString from "../utils/isPositionInString";
import getImportModulePath from "../utils/getImportModulePath";
import isPositionInComment from "../utils/isPositionInComment";
import { getWorkspaceRelativeImportPath } from "../utils/getPath";

export default class CompletionItemProvider
  implements vscode.CompletionItemProvider
{
  static config = vscode.workspace.getConfiguration(CONFIGURATION_KEY);
  static aliasMap = CompletionItemProvider.config.get<Record<string, string>>(
    CONFIGURATIONS.ALIASES,
    {}
  );

  provideCompletionItems = async (
    document: vscode.TextDocument,
    position: vscode.Position
  ) => {
    const importModulePath = await getImportModulePath(document, position);
    if (!importModulePath) {
      return;
    }

    const classNames = await ClassNameCache.getClassNamesFromImportPath(
      getWorkspaceRelativeImportPath(document, importModulePath)
    );
    if (!classNames) {
      return;
    }

    if (
      (await isPositionInString(document, position)) ||
      (await isPositionInComment(document, position))
    ) {
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

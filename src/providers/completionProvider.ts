import * as vscode from "vscode";
import { MESSAGES } from "../config";
import ClassNameCache from "../libs/classNameCache";
import isPositionInString from "../utils/isPositionInString";
import isPositionInComment from "../utils/isPositionInComment";
import { getWorkspaceRelativeImportPath } from "../utils/getPath";
import { getModuleFileRegex } from "../utils/getFileExtensionRegex";

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

    const line = document.lineAt(position).text;
    const prefix = line.substring(0, position.character);
    const match = prefix.match(/(\w+)\.([\w-]*)$/);
    if (!match) {
      return;
    }

    const [_, varName] = match;
    const importRegex = new RegExp(
      `import\\s+${varName}\\s+from\\s+['"](.+\\.module\\.(${getModuleFileRegex()}))['"]`
    );
    const fullText = document.getText();
    const importMatch = fullText.match(importRegex);
    if (!importMatch) {
      return;
    }

    const classNames = await ClassNameCache.getClassNamesFromImportPath(
      getWorkspaceRelativeImportPath(document, importMatch[1])
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

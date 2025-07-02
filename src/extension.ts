import * as vscode from "vscode";
import { SUPPORTED_LANGS, SUPPORTED_MODULES } from "./config";
import ModulesRenameProvider from "./providers/renameProvider";
import CompletionItemProvider from "./providers/completionProvider";
import DefinitionProvider from "./providers/definitionProvider";
import checkDocument from "./libs/checkDocument";
import getAllFiles from "./utils/getAllFiles";
import CssModuleDependencyCache from "./libs/cssModuleDependencyCache";

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cssModules");

  const resetCacheCommand = vscode.commands.registerCommand(
    "css-scss-modules-intellisense.resetCache",
    async () => {
      try {
        await CssModuleDependencyCache.populateCacheFromWorkspace();
        vscode.window.showInformationMessage("Cache has been reset");
      } catch (e) {
        vscode.window.showErrorMessage(e as string);
        return false;
      }
      return true;
    }
  );

  // Completion Provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    SUPPORTED_LANGS,
    new CompletionItemProvider(),
    "." // trigger on dot
  );

  // Definition Provider
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    SUPPORTED_LANGS,
    new DefinitionProvider()
  );

  // RenameProvider
  const renameProvider = vscode.languages.registerRenameProvider(
    SUPPORTED_MODULES,
    new ModulesRenameProvider()
  );

  vscode.workspace.onDidOpenTextDocument((document) =>
    checkDocument(document, diagnosticCollection)
  );
  vscode.workspace.onDidChangeTextDocument((e) =>
    checkDocument(e.document, diagnosticCollection)
  );
  getAllFiles().then((files) =>
    files.forEach(async (uri) =>
      checkDocument(
        await vscode.workspace.openTextDocument(uri),
        diagnosticCollection
      )
    )
  );

  CssModuleDependencyCache.initialize(context);
  vscode.workspace.onDidCreateFiles((e) => {
    e.files.forEach((uri) =>
      CssModuleDependencyCache.updateCacheForDocument({ uri })
    );
  });
  vscode.workspace.onDidChangeTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e.document })
  );

  context.subscriptions.push(
    resetCacheCommand,
    completionProvider,
    definitionProvider,
    renameProvider
  );
}

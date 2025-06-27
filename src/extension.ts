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
    completionProvider,
    definitionProvider,
    renameProvider
  );
}

import * as vscode from "vscode";
import { SUPPORTED_LANGS, SUPPORTED_MODULE_FILES } from "./config";
import RenameProvider from "./providers/renameProvider";
import CompletionItemProvider from "./providers/completionProvider";
import DefinitionProvider from "./providers/definitionProvider";
import checkDocument from "./libs/checkDocument";

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
    SUPPORTED_MODULE_FILES,
    new RenameProvider()
  );

  vscode.workspace.onDidOpenTextDocument((document) =>
    checkDocument(document, diagnosticCollection)
  );
  vscode.workspace.onDidChangeTextDocument((e) =>
    checkDocument(e.document, diagnosticCollection)
  );
  vscode.workspace.textDocuments.forEach((document) =>
    checkDocument(document, diagnosticCollection)
  );

  context.subscriptions.push(
    completionProvider,
    definitionProvider,
    renameProvider
  );
}

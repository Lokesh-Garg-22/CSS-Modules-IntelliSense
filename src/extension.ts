import * as vscode from "vscode";
import { SUPPORTED_LANGS, SUPPORTED_MODULES } from "./config";
import {
  ModulesRenameProvider,
  ScriptsRenameProvider,
} from "./providers/renameProvider";
import CompletionItemProvider from "./providers/completionProvider";
import {
  ScriptDefinitionProvider,
  ModuleDefinitionProvider as ModuleDefinitionProvider,
} from "./providers/definitionProvider";
import Cache from "./libs/cache";
import loadCaches from "./libs/loadCaches";
import checkDocument from "./libs/checkDocument";
import ClassNameCache from "./libs/classNameCache";
import { getAllScriptFiles } from "./utils/getAllFiles";
import CssModuleDependencyCache from "./libs/cssModuleDependencyCache";

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cssModules");

  Cache.context = context;
  loadCaches(diagnosticCollection);

  vscode.workspace.onDidOpenTextDocument((document) =>
    checkDocument(document, diagnosticCollection)
  );
  vscode.workspace.onDidChangeTextDocument((e) =>
    checkDocument(e.document, diagnosticCollection)
  );
  getAllScriptFiles().then((files) =>
    files.forEach(async (uri) =>
      checkDocument(
        await vscode.workspace.openTextDocument(uri),
        diagnosticCollection
      )
    )
  );

  // Commands
  const resetCacheCommand = vscode.commands.registerCommand(
    "css-scss-modules-intellisense.resetCache",
    async () => {
      try {
        await CssModuleDependencyCache.populateCacheFromWorkspace();
        await ClassNameCache.populateCacheFromWorkspace();
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
  const scriptDefinitionProvider = vscode.languages.registerDefinitionProvider(
    SUPPORTED_LANGS,
    new ScriptDefinitionProvider()
  );
  const moduleDefinitionProvider = vscode.languages.registerDefinitionProvider(
    SUPPORTED_MODULES,
    new ModuleDefinitionProvider()
  );

  // RenameProvider
  const scriptsRenameProvider = vscode.languages.registerRenameProvider(
    SUPPORTED_LANGS,
    new ScriptsRenameProvider()
  );
  const modulesRenameProvider = vscode.languages.registerRenameProvider(
    SUPPORTED_MODULES,
    new ModulesRenameProvider()
  );

  context.subscriptions.push(
    resetCacheCommand,
    completionProvider,
    moduleDefinitionProvider,
    scriptDefinitionProvider,
    modulesRenameProvider,
    scriptsRenameProvider
  );
}

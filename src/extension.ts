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
import CheckDocument from "./libs/checkDocument";
import CssModuleDependencyCache from "./libs/cssModuleDependencyCache";
import { registerTriggerOnEdit } from "./libs/processConfig";

export async function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cssModules");
  CheckDocument.diagnosticCollection = diagnosticCollection;

  Cache.context = context;
  const loaded = Cache.loadCache();
  if (!loaded) {
    CssModuleDependencyCache.populateCacheFromWorkspace();
  }
  loadCaches();

  const files = vscode.workspace.textDocuments;
  for (const file of files) {
    CheckDocument.push(await vscode.workspace.openTextDocument(file.uri));
  }
  vscode.workspace.onDidOpenTextDocument((document) =>
    CheckDocument.push(document)
  );
  registerTriggerOnEdit((e) => {
    CheckDocument.push(e.document);
  });

  // Commands
  const resetCacheCommand = vscode.commands.registerCommand(
    "css-scss-modules-intellisense.resetCache",
    async () => {
      return vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Resetting CSS Modules Cache...",
        },
        async () => {
          try {
            await Cache.clearCache();
            await CssModuleDependencyCache.populateCacheFromWorkspace();

            vscode.window.showInformationMessage("Cache has been reset");
            return true;
          } catch (e) {
            if (e instanceof vscode.CancellationError) {
              vscode.window.showWarningMessage("Cache reset was cancelled.");
            } else {
              vscode.window.showErrorMessage(`Cache reset failed: ${e}`);
            }
            return false;
          }
        }
      );
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

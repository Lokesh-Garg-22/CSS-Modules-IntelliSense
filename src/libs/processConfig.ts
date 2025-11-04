import * as vscode from "vscode";
import { CONFIGURATION_KEY, CONFIGURATIONS } from "../config";

function registerConditionalListener<T>(
  event: vscode.Event<T>,
  settingKey: string,
  func: (arg: T) => void
) {
  let disposable: vscode.Disposable | undefined;

  const applyConfig = () => {
    const config = vscode.workspace.getConfiguration(CONFIGURATION_KEY);
    const enabled = config.get<boolean>(settingKey, true);

    if (enabled && !disposable) {
      disposable = event(func);
    } else if (!enabled && disposable) {
      disposable.dispose();
      disposable = undefined;
    }
  };

  applyConfig();

  const watcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(`${CONFIGURATION_KEY}.${settingKey}`)) {
      applyConfig();
    }
  });

  return {
    dispose: () => {
      disposable?.dispose();
      watcher.dispose();
    },
  };
}

export const registerTriggerOnEdit = (
  func: (e: vscode.TextDocumentChangeEvent) => void
) =>
  registerConditionalListener(
    vscode.workspace.onDidChangeTextDocument,
    CONFIGURATIONS.PROCESS_ON_EDIT,
    func
  );

export const registerTriggerOnSave = (func: (e: vscode.TextDocument) => void) =>
  registerConditionalListener(
    vscode.workspace.onDidSaveTextDocument,
    CONFIGURATIONS.PROCESS_ON_SAVE,
    func
  );

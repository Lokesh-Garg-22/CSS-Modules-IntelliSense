import * as vscode from "vscode";
import {
  getModuleFileRegex,
  getScriptFileRegex,
} from "./getFileExtensionRegex";

const config = vscode.workspace.getConfiguration("cssModulesIntellisense");
const blacklistPatterns = config.get<string[]>("blacklistPatterns", []);

export const getAllScriptFiles = async () => {
  const includePattern = `**/*.{${getScriptFileRegex()}}`;

  const excludePattern = `{${blacklistPatterns.join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

export const getAllModuleFiles = async () => {
  const includePattern = `**/*.{${getModuleFileRegex()}}`;

  const excludePattern = `{${blacklistPatterns.join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

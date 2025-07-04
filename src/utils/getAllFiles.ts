import * as vscode from "vscode";
import { getScriptFileRegex } from "./getFileExtensionRegex";

const config = vscode.workspace.getConfiguration("cssModulesIntellisense");
const blacklistPatterns = config.get<string[]>("blacklistPatterns", []);

const getAllFiles = async () => {
  const includePattern = `**/*.{${getScriptFileRegex()}}`;

  const excludePattern = `{${blacklistPatterns.join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

export default getAllFiles;

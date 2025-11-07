import * as vscode from "vscode";
import {
  getModuleFileRegex,
  getScriptFileRegex,
} from "./getFileExtensionRegex";
import { CONFIGURATION_KEY, CONFIGURATIONS } from "../config";

const config = vscode.workspace.getConfiguration(CONFIGURATION_KEY);
const blacklistPatterns = config.get<string[]>(
  CONFIGURATIONS.BLACKLIST_PATTERNS,
  []
);

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
  const includePattern = `**/*.module.{${getModuleFileRegex(",")}}`;

  const excludePattern = `{${blacklistPatterns.join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

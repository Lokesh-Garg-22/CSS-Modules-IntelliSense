import * as vscode from "vscode";
import {
  getModuleFileRegex,
  getScriptFileRegex,
} from "./getFileExtensionRegex";
import { getBlacklistPatterns } from "../libs/vsConfig";

export const getAllScriptFiles = async () => {
  const includePattern = `**/*.{${getScriptFileRegex()}}`;
  const excludePattern = `{${getBlacklistPatterns().join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

export const getAllModuleFiles = async () => {
  const includePattern = `**/*.module.{${getModuleFileRegex(",")}}`;
  const excludePattern = `{${getBlacklistPatterns().join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

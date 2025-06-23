import * as vscode from "vscode";

const config = vscode.workspace.getConfiguration("cssModulesIntellisense");
const blacklistPatterns = config.get<string[]>("blacklistPatterns", []);

const getAllFiles = async () => {
  const includePattern = "**/*.{ts,tsx,js,jsx}";

  const excludePattern = `{${blacklistPatterns.join(",")}}`;

  const files = await vscode.workspace.findFiles(
    includePattern,
    excludePattern
  );

  return files;
};

export default getAllFiles;

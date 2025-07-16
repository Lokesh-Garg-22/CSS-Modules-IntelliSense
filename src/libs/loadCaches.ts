import * as vscode from "vscode";
import { SUPPORTED_MODULES } from "../config";
import { resolveWorkspaceRelativePath } from "../utils/getPath";
import CssModuleDependencyCache from "./cssModuleDependencyCache";
import ClassNameCache from "./classNameCache";
import CheckDocument from "./checkDocument";

const updateClassNameCache = async (e: vscode.TextDocument) => {
  await ClassNameCache.extractFromUri(e.uri);

  if (SUPPORTED_MODULES.includes(e.languageId)) {
    CssModuleDependencyCache.getDependentsForDocument(e).forEach(
      async (workspacePath) => {
        const resolvedPath = resolveWorkspaceRelativePath(workspacePath);
        if (!resolvedPath) {
          return;
        }
        const document = await vscode.workspace.openTextDocument(resolvedPath);
        CheckDocument.push(document);
      }
    );
  }
};

const loadCaches = () => {
  // ClassNameCache
  vscode.workspace.onDidSaveTextDocument((e) => updateClassNameCache(e));

  vscode.workspace.onDidChangeTextDocument((e) =>
    updateClassNameCache(e.document)
  );

  vscode.workspace.onDidDeleteFiles((e) =>
    e.files.forEach((uri) => ClassNameCache.extractFromUri(uri))
  );

  // CssModuleDependencyCache
  vscode.workspace.onDidCreateFiles((e) =>
    e.files.forEach((uri) =>
      CssModuleDependencyCache.updateCacheForDocument({ uri })
    )
  );

  vscode.workspace.onDidSaveTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e })
  );

  vscode.workspace.onDidOpenTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e })
  );

  vscode.workspace.onDidChangeTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e.document })
  );

  vscode.workspace.textDocuments.forEach(async (file) => {
    CssModuleDependencyCache.updateCacheForDocument({ document: file });
  });
};

export default loadCaches;

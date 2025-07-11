import * as vscode from "vscode";
import { SUPPORTED_MODULES } from "../config";
import { resolveWorkspaceRelativePath } from "../utils/getPath";
import CssModuleDependencyCache from "./cssModuleDependencyCache";
import ClassNameCache from "./classNameCache";
import checkDocument from "./checkDocument";

const loadCaches = (diagnosticCollection: vscode.DiagnosticCollection) => {
  // ClassNameCache
  ClassNameCache.initialize();

  vscode.workspace.onDidSaveTextDocument((e) =>
    ClassNameCache.extractFromUri(e.uri)
  );

  vscode.workspace.onDidChangeTextDocument(async (e) => {
    await ClassNameCache.extractFromUri(e.document.uri);

    if (SUPPORTED_MODULES.includes(e.document.languageId)) {
      CssModuleDependencyCache.getDependentsForDocument(e.document).forEach(
        async (workspacePath) => {
          const resolvedPath = resolveWorkspaceRelativePath(workspacePath);
          if (!resolvedPath) {
            return;
          }
          const document = await vscode.workspace.openTextDocument(
            resolvedPath
          );
          checkDocument(document, diagnosticCollection);
        }
      );
    }
  });

  vscode.workspace.onDidDeleteFiles((e) =>
    e.files.forEach((uri) => ClassNameCache.extractFromUri(uri))
  );

  // CssModuleDependencyCache
  CssModuleDependencyCache.initialize();

  vscode.workspace.onDidCreateFiles((e) =>
    e.files.forEach((uri) =>
      CssModuleDependencyCache.updateCacheForDocument({ uri })
    )
  );

  vscode.workspace.onDidChangeTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e.document })
  );
};

export default loadCaches;

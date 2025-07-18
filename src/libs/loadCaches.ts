import * as vscode from "vscode";
import CssModuleDependencyCache from "./cssModuleDependencyCache";
import ClassNameCache from "./classNameCache";

const loadCaches = () => {
  // ClassNameCache
  vscode.workspace.onDidSaveTextDocument((e) =>
    ClassNameCache.updateClassNameCache(e)
  );

  vscode.workspace.onDidChangeTextDocument((e) =>
    ClassNameCache.updateClassNameCache(e.document)
  );

  vscode.workspace.onDidDeleteFiles((e) =>
    e.files.forEach((uri) => ClassNameCache.extractFromUri(uri))
  );

  // CssModuleDependencyCache
  vscode.workspace.onDidCreateFiles((e) => {
    for (const uri of e.files) {
      CssModuleDependencyCache.updateCacheForDocument({ uri });
    }
  });

  vscode.workspace.onDidSaveTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e })
  );

  vscode.workspace.onDidOpenTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e })
  );

  vscode.workspace.onDidChangeTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e.document })
  );

  const files = vscode.workspace.textDocuments;
  for (const file of files) {
    CssModuleDependencyCache.updateCacheForDocument({ document: file });
  }
};

export default loadCaches;

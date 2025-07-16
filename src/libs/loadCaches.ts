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

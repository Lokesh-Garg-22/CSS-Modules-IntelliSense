import * as vscode from "vscode";
import CssModuleDependencyCache from "./cssModuleDependencyCache";
import ClassNameCache from "./classNameCache";
import { registerTriggerOnEdit, registerTriggerOnSave } from "./processConfig";

const loadCaches = () => {
  // ClassNameCache
  registerTriggerOnSave((e) => ClassNameCache.updateClassNameCache(e));

  registerTriggerOnEdit((e) => ClassNameCache.updateClassNameCache(e.document));

  vscode.workspace.onDidDeleteFiles((e) =>
    e.files.forEach((uri) => ClassNameCache.extractFromUri(uri))
  );

  // CssModuleDependencyCache
  vscode.workspace.onDidCreateFiles((e) => {
    for (const uri of e.files) {
      CssModuleDependencyCache.updateCacheForDocument({ uri });
    }
  });

  registerTriggerOnSave((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e })
  );

  vscode.workspace.onDidOpenTextDocument((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e })
  );

  registerTriggerOnEdit((e) =>
    CssModuleDependencyCache.updateCacheForDocument({ document: e.document })
  );

  const files = vscode.workspace.textDocuments;
  for (const file of files) {
    CssModuleDependencyCache.updateCacheForDocument({ document: file });
  }
};

export default loadCaches;

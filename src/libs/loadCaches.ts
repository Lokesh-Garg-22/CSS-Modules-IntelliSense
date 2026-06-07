import * as vscode from "vscode";
import ClassNameCache from "./classNameCache";
import CssModuleDependencyCache from "./cssModuleDependencyCache";
import { registerTriggerOnEdit, registerTriggerOnSave } from "./processConfig";

const loadCaches = () => {
  // ClassNameCache
  registerTriggerOnSave((e) => {
    ClassNameCache.updateClassNameCache(e).catch(console.error);
  });

  registerTriggerOnEdit((e) => {
    ClassNameCache.updateClassNameCache(e.document).catch(console.error);
  });

  vscode.workspace.onDidDeleteFiles((e) => {
    e.files.forEach((uri) => {
      ClassNameCache.extractFromUri(uri).catch(console.error);
    });
  });

  // CssModuleDependencyCache
  vscode.workspace.onDidCreateFiles((e) => {
    for (const uri of e.files) {
      CssModuleDependencyCache.updateCacheForDocument({ uri }).catch(
        console.error
      );
    }
  });

  registerTriggerOnSave((e) => {
    CssModuleDependencyCache.updateCacheForDocument({ document: e }).catch(
      console.error
    );
  });

  vscode.workspace.onDidOpenTextDocument((e) => {
    CssModuleDependencyCache.updateCacheForDocument({ document: e }).catch(
      console.error
    );
  });

  registerTriggerOnEdit((e) => {
    CssModuleDependencyCache.updateCacheForDocument({
      document: e.document,
    }).catch(console.error);
  });

  const files = vscode.workspace.textDocuments;
  for (const file of files) {
    CssModuleDependencyCache.updateCacheForDocument({ document: file }).catch(
      console.error
    );
  }
};

export default loadCaches;

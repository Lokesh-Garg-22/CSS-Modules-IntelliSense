import * as vscode from "vscode";
import * as vsctm from "vscode-textmate";
import getRegistry from "./getRegistry";

const grammarMap = new Map<String, vsctm.IGrammar | null>();

const getGrammar = async (document: vscode.TextDocument) => {
  const scopeName = {
    javascript: "source.js",
    javascriptreact: "source.js.jsx",
    typescript: "source.ts",
    typescriptreact: "source.tsx",
    css: "source.css",
    less: "source.css.less",
    scss: "source.css.scss",
  }[document.languageId];

  if (!scopeName) {
    return;
  }
  if (!grammarMap.has(scopeName)) {
    const registry = await getRegistry();
    grammarMap.set(scopeName, await registry.loadGrammar(scopeName));
  }

  return grammarMap.get(scopeName);
};

export default getGrammar;

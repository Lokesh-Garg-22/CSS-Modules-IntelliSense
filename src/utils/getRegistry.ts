import * as vsctm from "vscode-textmate";
import * as oniguruma from "vscode-oniguruma";
import * as path from "path";
import * as fs from "fs";

let registry: vsctm.Registry;

const getRegistry = async () => {
  if (registry) {
    return registry;
  }

  const wasmBin = fs.readFileSync(
    require.resolve("vscode-oniguruma/release/onig.wasm")
  ).buffer;
  const onigLib = oniguruma.loadWASM(wasmBin).then(() => ({
    createOnigScanner: (patterns: string[]) =>
      new oniguruma.OnigScanner(patterns),
    createOnigString: (s: string) => new oniguruma.OnigString(s),
  }));

  registry = new vsctm.Registry({
    onigLib,
    loadGrammar: async (scopeName) => {
      const langMap: Record<string, string> = {
        "source.js": "JavaScript.tmLanguage.json",
        "source.js.jsx": "JavaScriptReact.tmLanguage.json",
        "source.ts": "TypeScript.tmLanguage.json",
        "source.tsx": "TypeScriptReact.tmLanguage.json",
      };
      const filename = langMap[scopeName];
      if (!filename) {
        return;
      }
      const grammarPath = path.join(
        __dirname,
        "..",
        "..",
        "syntaxes",
        filename
      );
      const grammarContent = fs.readFileSync(grammarPath, "utf-8");
      return vsctm.parseRawGrammar(grammarContent, grammarPath);
    },
  });

  return registry;
};

export default getRegistry;

import * as vscode from "vscode";
import * as vsctm from "vscode-textmate";
import getGrammar from "./getGrammar";

type CachedLine = {
  hash: string;
  ruleStack: vsctm.StateStack;
  tokens: vsctm.IToken[];
};

const grammarCache = new WeakMap<
  vscode.TextDocument,
  {
    lineCache: Map<number, CachedLine>;
  }
>();

const fnv1aHash = (str: string): string => {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Ensure 32-bit unsigned and return as hex or string
  return (hash >>> 0).toString(16);
};

const getGrammarTokens = async (
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<vsctm.IToken[]> => {
  const grammar = await getGrammar(document);
  if (!grammar) {
    return [];
  }

  // Get or init cache
  let cache = grammarCache.get(document);
  if (!cache) {
    cache = { lineCache: new Map() };
    grammarCache.set(document, cache);
  }

  const { lineCache } = cache;

  let prevState = vsctm.INITIAL;
  for (let i = 0; i <= position.line; i++) {
    const lineText = document.lineAt(i).text;
    const lineHash = fnv1aHash(lineText);

    const cached = lineCache.get(i);
    if (cached && cached.hash === lineHash) {
      prevState = cached.ruleStack;
      if (i === position.line) {
        return cached.tokens;
      }
      continue;
    }

    const result = grammar.tokenizeLine(lineText, prevState);
    const newCache: CachedLine = {
      hash: lineHash,
      ruleStack: result.ruleStack,
      tokens: result.tokens,
    };
    lineCache.set(i, newCache);

    if (i === position.line) {
      return result.tokens;
    }

    prevState = result.ruleStack;
  }

  return [];
};

export default getGrammarTokens;

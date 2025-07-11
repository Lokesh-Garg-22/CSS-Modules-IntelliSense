import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

type CacheJsonObject = {
  modulePathCache: Record<string, string[]>;
  classNameCache: Record<string, string[]>;
};

const cacheFile = "cache.json";

export default class Cache {
  /**
   * Cache mapping from imported CSS module paths (relative to workspace)
   * to the set of document paths that import them.
   */
  static modulePathCache: Map<string, Set<string>> = new Map();

  /**
   * Cache mapping from imported CSS module paths (relative to workspace)
   * to the set of document paths that import them.
   */
  static classNameCache: Map<string, Set<string>> = new Map();

  private static _context: vscode.ExtensionContext;
  /**
   * The current extension context.
   */
  public static get context(): vscode.ExtensionContext {
    return Cache._context;
  }
  public static set context(value: vscode.ExtensionContext) {
    Cache._context = value;
  }

  /**
   * Saves the current cache to a JSON file in the extension’s storage directory.
   * Each key is a CSS module file, and the value is a list of documents that import it.
   */
  static saveCache() {
    if (!this.context.storageUri) {
      return false;
    }

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
    const cacheAsObject: CacheJsonObject = {
      modulePathCache: {},
      classNameCache: {},
    };

    for (const [key, valueSet] of this.modulePathCache.entries()) {
      cacheAsObject.modulePathCache[key] = [...valueSet];
    }

    for (const [key, valueSet] of this.classNameCache.entries()) {
      cacheAsObject.classNameCache[key] = [...valueSet];
    }

    try {
      fs.mkdirSync(this.context.storageUri.fsPath, { recursive: true });
      fs.writeFileSync(
        cacheFilePath,
        JSON.stringify(cacheAsObject, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error saving cache:", error);
      return false;
    }
    return true;
  }

  /**
   * Loads the cache from a JSON file stored in the extension’s storage directory.
   * If no file exists or loading fails, the cache remains empty.
   */
  static loadCache() {
    if (!this.context.storageUri) {
      return false;
    }

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
    if (!fs.existsSync(cacheFilePath)) {
      return false;
    }

    try {
      const raw = fs.readFileSync(cacheFilePath, "utf-8");
      const parsed: { [K in keyof CacheJsonObject]?: CacheJsonObject[K] } =
        JSON.parse(raw);

      this.modulePathCache = new Map(
        Object.entries(parsed.modulePathCache || {}).map(
          ([key, valueArray]) => [key, new Set(valueArray)]
        )
      );

      this.classNameCache = new Map(
        Object.entries(parsed.classNameCache || {}).map(([key, valueArray]) => [
          key,
          new Set(valueArray),
        ])
      );
    } catch (error) {
      console.error("Error loading cache:", error);
      return false;
    }
    return true;
  }
}

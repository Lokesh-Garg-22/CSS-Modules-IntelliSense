import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { CSS_MODULES_CACHE_FILENAME, DEBOUNCE_TIMER } from "../config";
import {
  CacheJsonObject,
  ClassNameCache,
  ClassNameRangeMap,
  ModulePathCache,
  ModulePathCacheSet,
  PathMapCache,
} from "../types/cache";

export default class Cache {
  static pathMapCache = new PathMapCache();

  /**
   * Cache mapping from imported CSS module paths (relative to workspace)
   * to the set of document paths that import them.
   */
  static modulePathCache = new ModulePathCache(this.pathMapCache);

  /**
   * Cache mapping from imported CSS module paths (relative to workspace)
   * to the set of document paths that import them.
   */
  static classNameCache = new ClassNameCache(this.pathMapCache, { max: 3 });

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

  static async clearCache() {
    if (!this.context.storageUri) {
      return false;
    }

    this.modulePathCache.clear();
    this.classNameCache.clear();
    this.pathMapCache.clear();

    const cacheFilePath = path.join(
      this.context.storageUri.fsPath,
      CSS_MODULES_CACHE_FILENAME
    );
    const cacheAsObject: CacheJsonObject = {
      pathMapCache: [],
      modulePathCache: {},
      classNameCache: {},
    };

    try {
      fs.mkdirSync(this.context.storageUri.fsPath, { recursive: true });
      fs.writeFileSync(
        cacheFilePath,
        JSON.stringify(cacheAsObject, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Error clearing cache:", error);
      return false;
    }
    return true;
  }

  static saveCacheDebounceId: NodeJS.Timeout;

  /**
   * Saves the current cache to a JSON file in the extension’s storage directory.
   * Each key is a CSS module file, and the value is a list of documents that import it.
   */
  static async saveCache() {
    clearTimeout(this.saveCacheDebounceId);
    this.saveCacheDebounceId = setTimeout(() => {
      this._saveCache();
    }, DEBOUNCE_TIMER.CACHE);
  }

  static async _saveCache() {
    if (!this.context.storageUri) {
      return false;
    }

    const cacheFilePath = path.join(
      this.context.storageUri.fsPath,
      CSS_MODULES_CACHE_FILENAME
    );
    const cacheAsObject: CacheJsonObject = {
      pathMapCache: [],
      modulePathCache: {},
      classNameCache: {},
    };

    cacheAsObject.pathMapCache = this.pathMapCache;

    for (const [key, valueSet] of this.modulePathCache.entries()) {
      cacheAsObject.modulePathCache[key] = [...valueSet];
    }

    for (const [key, valueSet] of this.classNameCache.entries()) {
      cacheAsObject.classNameCache[key] = Object.fromEntries(valueSet);
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
    }
  }

  /**
   * Loads the cache from a JSON file stored in the extension’s storage directory.
   * If no file exists or loading fails, the cache remains empty.
   */
  static async loadCache() {
    if (!this.context.storageUri) {
      return false;
    }

    const cacheFilePath = path.join(
      this.context.storageUri.fsPath,
      CSS_MODULES_CACHE_FILENAME
    );
    if (!fs.existsSync(cacheFilePath)) {
      return false;
    }

    try {
      const raw = fs.readFileSync(cacheFilePath, "utf-8");
      const parsed: { [K in keyof CacheJsonObject]?: CacheJsonObject[K] } =
        JSON.parse(raw);

      this.pathMapCache.setArray(parsed.pathMapCache || []);

      this.modulePathCache.setMap(
        Object.entries(parsed.modulePathCache || {}).map(
          ([key, valueArray]) => [
            key,
            new ModulePathCacheSet(this.pathMapCache, valueArray),
          ]
        )
      );

      this.classNameCache.setMap(
        Object.entries(parsed.classNameCache || {}).map(([key, value]) => [
          key,
          new ClassNameRangeMap(Object.entries(value)),
        ])
      );
    } catch (error) {
      console.error("Error loading cache:", error);
      return false;
    }
    return true;
  }
}

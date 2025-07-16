import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DEBOUNCE_TIMER } from "../config";
import { LRUCache } from "lru-cache";

type CacheJsonObject = {
  pathMapCache: Array<string>;
  modulePathCache: Record<number, number[]>;
  classNameCache: Record<number, Record<string, ClassNameData[]>>;
};

export type ClassNameData = { range: vscode.Range };

const cacheFile = "cache.json";

export const isLRUCache = <K extends {}, V extends {}, FC = unknown>(
  cache: Map<K, V> | LRUCache<K, V, FC>
): cache is LRUCache<K, V, FC> => Object.keys(cache).includes("fetch");

class PathMapCache extends Array<string> {
  protected reverseMap = new Map<string, number>();

  clear() {
    while (this.length) {
      this.pop();
    }
    this.reverseMap.clear();
    return this;
  }

  push(...items: string[]): number {
    const length = super.push(...items);
    items.forEach((item) => {
      this.reverseMap.set(item, this.indexOf(item));
    });
    return length;
  }

  setArray(entries: readonly string[]) {
    this.clear();
    entries.forEach((entry) => {
      this.push(entry);
    });
  }

  getKeyFormIndex(index: number) {
    return this[index];
  }

  getIndexFormKey(key: string) {
    if (this.reverseMap.has(key)) {
      return this.reverseMap.get(key) as NonNullable<
        ReturnType<typeof this.reverseMap.get>
      >;
    }
    this.push(key);
    return this.reverseMap.get(key) as NonNullable<
      ReturnType<typeof this.reverseMap.get>
    >;
  }
}

class BaseCache<V extends {}, FC = unknown> {
  protected cache: Map<number, V> | LRUCache<number, V, FC>;
  protected pathMapCache: PathMapCache;

  constructor(pathMapCache: PathMapCache, cache: typeof this.cache) {
    this.cache = cache;
    this.pathMapCache = pathMapCache;
  }

  clear() {
    return this.cache.clear();
  }
  delete(key: number) {
    return this.cache.delete(key);
  }
  get(key: number) {
    return this.cache.get(key);
  }
  has(key: number) {
    return this.cache.has(key);
  }
  set(key: number, value: V) {
    this.cache.set(key, value);
    return this;
  }
  entries() {
    return this.cache.entries();
  }
  keys() {
    return this.cache.keys();
  }
  values() {
    return this.cache.values();
  }
  [Symbol.iterator]() {
    return this.cache[Symbol.iterator]();
  }

  hasByKey(key: string): boolean {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.has(keyIndex);
  }

  getByKey(key: string) {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.get(keyIndex);
  }

  setByKey(key: string, value: V): this {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.set(keyIndex, value);
  }

  setMap(entries: readonly (readonly [string, V])[]) {
    this.clear;
    entries.forEach((entry) => {
      this.setByKey(entry[0], entry[1]);
    });
  }

  deleteByKey(key: string): boolean {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.delete(keyIndex);
  }
}

class ModulePathCacheSet extends Set<number> {
  protected pathMapCache: PathMapCache;

  constructor(pathMapCache: PathMapCache, values?: readonly number[] | null) {
    super(values ?? undefined);
    this.pathMapCache = pathMapCache;
  }

  addByKey(value: string): this {
    const valueIndex = this.pathMapCache.getIndexFormKey(value);
    return this.add(valueIndex);
  }

  toKeyArray() {
    const arr = [...this];
    return arr.map((ele) => this.pathMapCache.getKeyFormIndex(ele));
  }
}

class ModulePathCache extends BaseCache<ModulePathCacheSet> {
  constructor(pathMap: PathMapCache) {
    super(pathMap, new Map<number, ModulePathCacheSet>());
  }

  createKey(key: string) {
    const set = new ModulePathCacheSet(this.pathMapCache);
    this.setByKey(key, set);
    return set;
  }
}

export class ClassNameDataMap extends Map<string, ClassNameData[]> {
  add(key: string, value: ClassNameData) {
    if (this.has(key)) {
      const arr = this.get(key)!;
      arr.push(value);
    } else {
      const arr = [value];
      this.set(key, arr);
    }
    return this;
  }
}

class ClassNameCache extends BaseCache<ClassNameDataMap> {
  constructor(
    pathMap: PathMapCache,
    options:
      | LRUCache<number, ClassNameDataMap>
      | LRUCache.Options<number, ClassNameDataMap, unknown>
  ) {
    const lruCache: ConstructorParameters<
      typeof BaseCache<ClassNameDataMap>
    >[1] = new LRUCache(options);
    super(pathMap, lruCache);
  }
}

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

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
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

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
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

    const cacheFilePath = path.join(this.context.storageUri.fsPath, cacheFile);
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
          new ClassNameDataMap(Object.entries(value)),
        ])
      );
    } catch (error) {
      console.error("Error loading cache:", error);
      return false;
    }
    return true;
  }
}

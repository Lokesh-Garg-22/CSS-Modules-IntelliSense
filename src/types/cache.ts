import type * as vscode from "vscode";
import { LRUCache } from "lru-cache";

export type CacheJsonObject = {
  pathMapCache: Array<string>;
  modulePathCache: Record<number, number[]>;
  classNameCache: Record<number, Record<string, ClassNameRange[]>>;
};

export type ClassNameRange = { range: vscode.Range };

export const isLRUCache = <K extends {}, V extends {}, FC = unknown>(
  cache: Map<K, V> | LRUCache<K, V, FC>
): cache is LRUCache<K, V, FC> => Object.keys(cache).includes("fetch");

export class PathMapCache extends Array<string> {
  protected reverseMap = new Map<string, number>();

  // Array mutation — keep the array and reverseMap in sync

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

  // Index ↔ key lookups — getIndexFormKey auto-inserts the key if not present (side effect)

  hasKey(key: string): boolean {
    return this.reverseMap.has(key);
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

  // Direct index access — operate on the internal numeric index, bypassing PathMapCache

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
  setMap(entries: readonly (readonly [number, V])[]) {
    this.clear();
    entries.forEach((entry) => {
      this.set(entry[0], entry[1]);
    });
  }

  // Iteration — expose the underlying cache's iteration interface

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

  // Path string access — translate a path string to its numeric index via PathMapCache, then operate

  hasByKey(key: string): boolean {
    if (!this.pathMapCache.hasKey(key)) {
      return false;
    }

    return this.has(this.pathMapCache.getIndexFormKey(key));
  }

  getByKey(key: string) {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.get(keyIndex);
  }

  setByKey(key: string, value: V): this {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.set(keyIndex, value);
  }

  setMapByKey(entries: readonly (readonly [string, V])[]) {
    this.clear();
    entries.forEach((entry) => {
      this.setByKey(entry[0], entry[1]);
    });
  }

  deleteByKey(key: string): boolean {
    const keyIndex = this.pathMapCache.getIndexFormKey(key);
    return this.delete(keyIndex);
  }
}

export class ModulePathCacheSet extends Set<number> {
  protected pathMapCache: PathMapCache;

  constructor(pathMapCache: PathMapCache, values?: readonly number[] | null) {
    super(values ?? undefined);
    this.pathMapCache = pathMapCache;
  }

  // Direct index access (add/has/delete) is inherited from Set<number>

  // Path string access — translate to numeric index via PathMapCache before operating

  addByKey(value: string): this {
    const valueIndex = this.pathMapCache.getIndexFormKey(value);
    return this.add(valueIndex);
  }

  toKeyArray() {
    const arr = [...this];
    return arr.map((ele) => this.pathMapCache.getKeyFormIndex(ele));
  }
}

export class ModulePathCache extends BaseCache<ModulePathCacheSet> {
  constructor(pathMap: PathMapCache) {
    super(pathMap, new Map<number, ModulePathCacheSet>());
  }

  // Creates an empty dependent set and registers it under the given CSS module path
  createKey(key: string) {
    const set = new ModulePathCacheSet(this.pathMapCache);
    this.setByKey(key, set);
    return set;
  }
}

export class ClassNameRangeMap extends Map<string, ClassNameRange[]> {
  add(key: string, value: ClassNameRange) {
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

export class ClassNameCache extends BaseCache<ClassNameRangeMap> {
  constructor(
    pathMap: PathMapCache,
    options:
      | LRUCache<number, ClassNameRangeMap>
      | LRUCache.Options<number, ClassNameRangeMap, unknown>
  ) {
    // Intermediate variable needed to satisfy the BaseCache constructor's union type
    const lruCache: ConstructorParameters<
      typeof BaseCache<ClassNameRangeMap>
    >[1] = new LRUCache(options);
    super(pathMap, lruCache);
  }
}

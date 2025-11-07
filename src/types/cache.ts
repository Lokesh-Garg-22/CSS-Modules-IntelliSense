import * as vscode from "vscode";
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

export class ModulePathCacheSet extends Set<number> {
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

export class ModulePathCache extends BaseCache<ModulePathCacheSet> {
  constructor(pathMap: PathMapCache) {
    super(pathMap, new Map<number, ModulePathCacheSet>());
  }

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
    const lruCache: ConstructorParameters<
      typeof BaseCache<ClassNameRangeMap>
    >[1] = new LRUCache(options);
    super(pathMap, lruCache);
  }
}

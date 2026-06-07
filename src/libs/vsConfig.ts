import * as vscode from "vscode";
import {
  CONFIGURATION_KEY,
  CONFIGURATIONS,
  DEFAULT_CLASS_NAME_CACHE_SIZE,
} from "../config";

export const getVsConfig = () =>
  vscode.workspace.getConfiguration(CONFIGURATION_KEY);

export const getAliasMap = (): Record<string, string> =>
  getVsConfig().get<Record<string, string>>(CONFIGURATIONS.ALIASES, {});

export const getBlacklistPatterns = (): string[] =>
  getVsConfig().get<string[]>(CONFIGURATIONS.BLACKLIST_PATTERNS, []);

export const getClassNameCacheSize = (): number =>
  getVsConfig().get<number>(
    CONFIGURATIONS.CLASS_NAME_CACHE_SIZE,
    DEFAULT_CLASS_NAME_CACHE_SIZE
  );

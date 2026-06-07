import * as vscode from "vscode";
import { CONFIGURATION_KEY, CONFIGURATIONS } from "../config";

export const getVsConfig = () =>
  vscode.workspace.getConfiguration(CONFIGURATION_KEY);

export const getAliasMap = (): Record<string, string> =>
  getVsConfig().get<Record<string, string>>(CONFIGURATIONS.ALIASES, {});

export const getBlacklistPatterns = (): string[] =>
  getVsConfig().get<string[]>(CONFIGURATIONS.BLACKLIST_PATTERNS, []);

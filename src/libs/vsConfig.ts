import * as vscode from "vscode";
import {
  CONFIGURATION_KEY,
  CONFIGURATIONS,
  CONFIGURATION_DEFAULTS,
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
    CONFIGURATION_DEFAULTS.CLASS_NAME_CACHE_SIZE
  );

const SEVERITY_MAP: Record<string, vscode.DiagnosticSeverity> = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
  hint: vscode.DiagnosticSeverity.Hint,
};

export const getClassNotDefinedEnabled = (): boolean =>
  getVsConfig().get<boolean>(
    CONFIGURATIONS.DIAGNOSTICS.CLASS_NOT_DEFINED.ENABLED,
    CONFIGURATION_DEFAULTS.DIAGNOSTICS.CLASS_NOT_DEFINED.ENABLED
  );

export const getClassNotDefinedSeverity = (): vscode.DiagnosticSeverity =>
  SEVERITY_MAP[
    getVsConfig().get<string>(
      CONFIGURATIONS.DIAGNOSTICS.CLASS_NOT_DEFINED.SEVERITY,
      CONFIGURATION_DEFAULTS.DIAGNOSTICS.CLASS_NOT_DEFINED.SEVERITY
    )
  ] ?? vscode.DiagnosticSeverity.Warning;

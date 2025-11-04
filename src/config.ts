export const SUPPORTED_LANGS = [
  "javascript",
  "typescript",
  "javascriptreact",
  "typescriptreact",
];

export const SUPPORTED_LANG_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export const SUPPORTED_MODULES = [
  "css",
  "scss",
  "sass",
  "less",
  "stylus",
  "postcss",
];

export const SUPPORTED_MODULE_EXTENSIONS = [
  "css",
  "scss",
  "sass",
  "less",
  "styl",
  "stylus",
  "pcss",
  "postcss",
];

export const MESSAGES = {
  DIAGNOSTIC: {
    CANNOT_FIND_MODULE: (s: string) => `Cannot find module '${s}'`,
    CLASS_NOT_DEFINED: (s1: string, s2: string) =>
      `Class '${s1}' is not defined in ${s2}`,
  },
  COMPLETION: {
    CSS_MODULE_CLASS: "CSS Module class",
  },
};

export const DEBOUNCE_TIMER = {
  CACHE: 1000,
  CHECK_DOCUMENT: 1,
  UPDATE_CLASS_NAME: 5000,
};

export const MAX_CHECK_DOCUMENT_QUEUE_LENGTH = 100;

export const CONFIGURATION_KEY = "cssModulesIntellisense";
export const CONFIGURATIONS = {
  ALIASES: "aliases",
  BLACKLIST_PATTERNS: "blacklistPatterns",
  PROCESS_ON_EDIT: "processOnEdit",
  PROCESS_ON_SAVE: "processOnSave",
};

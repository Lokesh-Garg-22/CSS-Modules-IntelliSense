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

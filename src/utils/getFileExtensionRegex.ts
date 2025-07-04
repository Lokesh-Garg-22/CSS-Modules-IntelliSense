import {
  SUPPORTED_LANG_EXTENSIONS,
  SUPPORTED_MODULE_EXTENSIONS,
} from "../config";

/**
 * Returns a string of supported CSS module file extensions joined by the given separator.
 * Useful for building regular expressions like: /\.module\.(css|scss|less)$/
 *
 * @param separator - The string used to separate file types (default is "|")
 * @returns A string like "css|scss|less"
 */
export const getModuleFileRegex = (separator = "|") => {
  return SUPPORTED_MODULE_EXTENSIONS.join(separator);
};

/**
 * Returns a string of supported language/script file extensions joined by the given separator.
 * Useful for matching or listing supported script types.
 *
 * @param separator - The string used to separate file types (default is ",")
 * @returns A string like "js,ts,jsx,tsx"
 */
export const getScriptFileRegex = (separator = ",") => {
  return SUPPORTED_LANG_EXTENSIONS.join(separator);
};

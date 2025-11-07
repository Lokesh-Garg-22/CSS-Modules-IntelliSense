export function sanitizeCssInput(css: string): string {
  // Replace all lines that start with `//` with an empty string
  return css.replace(/^\s*\/\/.*$/gm, "\n");
}

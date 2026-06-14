export function sanitizeCssInput(css: string): string {
  // Replace all lines that start with `//` with an empty string
  return css.replace(/^[ \t\r\f\v]*\/\/.*$/gm, "");
}

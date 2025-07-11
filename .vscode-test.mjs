import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "dist/test/**/*.test.js",
  version: "1.93.1",
  workspaceFolder: ".",
});

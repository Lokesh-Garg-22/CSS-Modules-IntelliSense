import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "dist/test/**/*.test.js",
  version: "1.101.0",
  workspaceFolder: ".",
});

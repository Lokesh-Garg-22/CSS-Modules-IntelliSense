import * as assert from "assert";
import * as vscode from "vscode";
import { extensionName, publisher } from "./config";

suite("Extension Tests", () => {
  test("Extension should activate", async () => {
    const ext = vscode.extensions.getExtension(`${publisher}.${extensionName}`);
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

  test("Run Command Reset Cache", async () => {
    const result = await vscode.commands.executeCommand(
      "css-scss-modules-intellisense.resetCache"
    );
    assert.equal(result, true);
  });
});

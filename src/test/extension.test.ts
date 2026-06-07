import * as assert from "assert";
import * as vscode from "vscode";
import { extensionName, publisher } from "./config";

suite("Extension Tests", function () {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension(`${publisher}.${extensionName}`);
    assert.ok(ext, `Extension "${publisher}.${extensionName}" not found`);
    await ext.activate();
  });

  test("Extension should activate", () => {
    const ext = vscode.extensions.getExtension(`${publisher}.${extensionName}`);
    assert.ok(ext?.isActive);
  });

  test("Run Command Reset Cache", async function () {
    this.timeout(10000);
    const result = await vscode.commands.executeCommand(
      "css-scss-modules-intellisense.resetCache"
    );
    assert.equal(result, true);
  });
});

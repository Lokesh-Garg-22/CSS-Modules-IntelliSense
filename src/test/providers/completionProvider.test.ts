import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import getRootPath from "../utils/getRootPath";
import { extensionName, publisher } from "../config";

suite("Completion Provider Tests", function () {
  this.timeout(60000);

  const samplePath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-1/Sample.jsx"
  );

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Should provide completion for styles.container", async () => {
    await vscode.extensions
      .getExtension(`${publisher}.${extensionName}`)
      ?.activate();
    const doc = await vscode.workspace.openTextDocument(samplePath);
    const editor = await vscode.window.showTextDocument(doc);

    // Go to position after "styles"
    const lineNum = 3;
    const pos = new vscode.Position(
      lineNum,
      doc.lineAt(lineNum).text.indexOf("styles") + 6
    );
    await editor.edit((edit) => {
      edit.insert(pos, ".");
    });

    const completions: vscode.CompletionList =
      await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        doc.uri,
        pos.translate(0, 1)
      );
    assert.ok(completions);
    assert.ok(completions!.items.length > 0);
    const labels = completions.items.map((item) => item.label);
    assert.ok(
      labels.includes("container"),
      'Expected to find "container" in completions'
    );
  });

  test("Should provide all classes for styles", async () => {
    await vscode.extensions
      .getExtension(`${publisher}.${extensionName}`)
      ?.activate();
    const doc = await vscode.workspace.openTextDocument(samplePath);
    const editor = await vscode.window.showTextDocument(doc);

    // Go to position after "styles"
    const lineNum = 3;
    const pos = new vscode.Position(
      lineNum,
      doc.lineAt(lineNum).text.indexOf("styles") + 6
    );
    await editor.edit((edit) => {
      edit.insert(pos, ".");
    });

    const completions: vscode.CompletionList =
      await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        doc.uri,
        pos.translate(0, 1)
      );
    assert.ok(completions);
    assert.ok(completions!.items.length >= 3);
    const labels = completions.items.map((item) => item.label);
    const expected = ["container", "box", "list"];
    expected.forEach((item) => {
      assert.ok(
        labels.includes(item),
        `Expected to find "${item}" in completions`
      );
    });
  });
});

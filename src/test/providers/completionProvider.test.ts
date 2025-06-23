import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import getRootPath from "../utils/getRootPath";

suite("Completion Provider Tests", () => {
  const samplePath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-1/Sample.jsx"
  );

  test("Should provide completion for styles.container", async () => {
    const doc = await vscode.workspace.openTextDocument(samplePath);
    const editor = await vscode.window.showTextDocument(doc);

    // Go to position after "styles."
    const pos = new vscode.Position(
      3,
      doc.lineAt(3).text.indexOf("styles.") + 7
    );
    const completions: vscode.CompletionList =
      await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        doc.uri,
        pos
      );

    const labels = completions.items.map((item) => item.label);
    assert.ok(
      labels.includes("container"),
      'Expected to find "container" in completions'
    );
  });
});

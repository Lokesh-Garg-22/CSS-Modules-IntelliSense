import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("CSS Modules Intellisense Extension Tests", () => {
  const samplePath = path.resolve(__dirname, "fixtures/Sample.js");

  test("Extension should activate", async () => {
    const ext = vscode.extensions.getExtension(
      "Lokesh Garg.css-modules-intellisense"
    );
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

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

  test("Go-to-Definition jumps to .container in SCSS", async () => {
    const doc = await vscode.workspace.openTextDocument(samplePath);
    await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(3, doc.lineAt(3).text.indexOf("container"));

    const locations: vscode.Location[] = await vscode.commands.executeCommand(
      "vscode.executeDefinitionProvider",
      doc.uri,
      pos
    );

    assert.ok(
      locations.length > 0,
      "Should return at least one definition location"
    );
    const defLoc = locations[0];
    const targetText = (
      await vscode.workspace.openTextDocument(defLoc.uri)
    ).getText();
    assert.ok(
      targetText.includes(".container"),
      "Expected definition file to contain .container"
    );
  });
});

import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import getRootPath from "../utils/getRootPath";

suite("Definition Provider Tests", () => {
  const samplePath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-1/Sample.jsx"
  );

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

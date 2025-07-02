import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import getRootPath from "../utils/getRootPath";

suite("Definition Provider Tests", function () {
  this.timeout(60000);

  const samplePath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-2/Sample.jsx"
  );

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Go-to-Definition jumps to .container in SCSS", async () => {
    const doc = await vscode.workspace.openTextDocument(samplePath);
    await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(3, doc.lineAt(3).text.indexOf("container"));
    const locations: vscode.LocationLink[] =
      await vscode.commands.executeCommand(
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
      await vscode.workspace.openTextDocument(defLoc.targetUri)
    ).getText();
    assert.ok(
      targetText.includes(".container"),
      "Expected definition file to contain .container"
    );
    const expectedRange = new vscode.Range(
      new vscode.Position(0, 1),
      new vscode.Position(0, 10)
    );
    assert.ok(
      defLoc.targetSelectionRange?.isEqual(expectedRange),
      `Expected Range of \`container\` to be ${expectedRange}, but got ${defLoc.targetSelectionRange}`
    );
  });
});

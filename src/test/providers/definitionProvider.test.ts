import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import getRootPath from "../utils/getRootPath";
import { rangeToString } from "../utils/utils";

suite("Definition Provider Tests", function () {
  this.timeout(60000);

  const sampleJsxPath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-2/Sample.jsx"
  );
  const sampleScssPath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-2/Sample.module.scss"
  );

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Go-to-Definition jumps to .container in SCSS", async () => {
    const doc = await vscode.workspace.openTextDocument(sampleJsxPath);
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
      defLoc.targetSelectionRange,
      `Expected Target Selection Range for .container`
    );

    assert.ok(
      targetText.includes(".container"),
      "Expected definition file to contain .container"
    );

    const expectedRange = new vscode.Range(
      new vscode.Position(0, 1),
      new vscode.Position(0, 10)
    );

    assert.ok(
      defLoc.targetSelectionRange.isEqual(expectedRange),
      `Expected Range of \`container\` to be ${rangeToString(
        expectedRange
      )}, but got ${rangeToString(defLoc.targetSelectionRange)}`
    );
  });

  test("Go-to-Definition jumps to .container in Script", async () => {
    const doc = await vscode.workspace.openTextDocument(sampleScssPath);
    await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(0, doc.lineAt(0).text.indexOf("container"));
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

    await Promise.all(
      locations.map(async (defLoc) => {
        if (defLoc.targetUri.path.endsWith(sampleJsxPath)) {
          assert.ok(
            defLoc.targetSelectionRange,
            `Expected Target Selection Range for .container`
          );

          const targetText = (
            await vscode.workspace.openTextDocument(defLoc.targetUri)
          ).getText();

          assert.ok(
            targetText.includes(".container"),
            "Expected definition file to contain .container"
          );

          const expectedRange = new vscode.Range(
            new vscode.Position(3, 32),
            new vscode.Position(3, 41)
          );

          assert.ok(
            defLoc.targetSelectionRange.isEqual(expectedRange),
            `Expected Range of \`container\` to be ${rangeToString(
              expectedRange
            )}, but got ${rangeToString(defLoc.targetSelectionRange)}`
          );
        } else if (defLoc.targetUri.path.endsWith(sampleScssPath)) {
          assert.ok(
            defLoc.targetSelectionRange,
            `Expected Target Selection Range for .container`
          );

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
            defLoc.targetSelectionRange.isEqual(expectedRange),
            `Expected Range of \`container\` to be ${rangeToString(
              expectedRange
            )}, but got ${rangeToString(defLoc.targetSelectionRange)}`
          );
        }
      })
    );
  });
});

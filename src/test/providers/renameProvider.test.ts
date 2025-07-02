import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import getRootPath from "../utils/getRootPath";
import { extensionName, publisher } from "../config";

suite("Rename Provider Tests", function () {
  this.timeout(60000);

  const samplePath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-3/Sample.module.scss"
  );

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Rename 'container' to 'wrapper' inside CSS Module", async () => {
    // Ensure extension is activated
    await vscode.extensions
      .getExtension(`${publisher}.${extensionName}`)
      ?.activate();

    const doc = await vscode.workspace.openTextDocument(samplePath);
    const editor = await vscode.window.showTextDocument(doc);

    const lineNum = 0;
    const lineText = doc.lineAt(lineNum).text;
    const charIndex = lineText.indexOf("container");
    assert.ok(charIndex !== -1, "'container' not found in document");

    const pos = new vscode.Position(lineNum, charIndex + 1);
    const newName = "wrapper";

    const workspaceEdit =
      await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
        "vscode.executeDocumentRenameProvider",
        doc.uri,
        pos,
        newName
      );

    assert.ok(workspaceEdit, "Rename edits should be returned");

    const changes = workspaceEdit!.entries();
    const expectedPaths = [
      path.resolve("assets/fixtures/fixture-3/Sample.jsx"),
      path.resolve("assets/fixtures/fixture-3/Sample.module.scss"),
    ].map((p) => vscode.Uri.file(p).fsPath); // normalize for platform

    const seenPaths = new Set<string>();

    for (const [uri, edits] of changes) {
      const uriPath = uri.fsPath;
      seenPaths.add(uriPath);

      assert.ok(
        expectedPaths.includes(uriPath),
        `Unexpected file edited: ${uriPath}`
      );

      for (const edit of edits) {
        assert.strictEqual(
          edit.newText,
          newName,
          `Expected new text to be "${newName}" in ${uriPath}`
        );
      }
    }

    // Final check: were all expected files seen?
    for (const expectedPath of expectedPaths) {
      assert.ok(
        seenPaths.has(expectedPath),
        `Expected rename to edit file: ${expectedPath}`
      );
    }
  });
});

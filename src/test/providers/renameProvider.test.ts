import * as path from "path";
import * as assert from "assert";
import * as vscode from "vscode";
import getRootPath from "../utils/getRootPath";
import { extensionName, publisher } from "../config";

suite("Rename Provider Tests", function () {
  this.timeout(60000);

  const sampleJsxPath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-3/Sample.jsx"
  );
  const sampleScssPath = path.resolve(
    getRootPath(),
    "assets/fixtures/fixture-3/Sample.module.scss"
  );

  let jsxDoc: vscode.TextDocument;
  let scssDoc: vscode.TextDocument;

  suiteSetup(async () => {
    await vscode.extensions
      .getExtension(`${publisher}.${extensionName}`)
      ?.activate();

    jsxDoc = await vscode.workspace.openTextDocument(sampleJsxPath);
    scssDoc = await vscode.workspace.openTextDocument(sampleScssPath);
  });

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Rename 'container' to 'wrapper' inside CSS Module", async () => {
    const doc = scssDoc;

    const lineNum = 0;
    const lineText = doc.lineAt(lineNum).text;
    const charIndex = lineText.indexOf("container");
    assert.ok(
      charIndex !== -1,
      `'container' not found in document: ${sampleScssPath}`
    );

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
      path.resolve(getRootPath(), "assets/fixtures/fixture-3/Sample.jsx"),
      path.resolve(
        getRootPath(),
        "assets/fixtures/fixture-3/Sample.module.scss"
      ),
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
        `Expected rename provider to edit file: ${expectedPath}`
      );
    }
  });

  test("Rename 'container' to 'wrapper' inside a Script", async () => {
    const doc = jsxDoc;

    const lineNum = 3;
    const lineText = doc.lineAt(lineNum).text;
    const charIndex = lineText.indexOf("container");
    assert.ok(
      charIndex !== -1,
      `'container' not found in document: ${sampleJsxPath}`
    );

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
      path.resolve(getRootPath(), "assets/fixtures/fixture-3/Sample.jsx"),
      path.resolve(
        getRootPath(),
        "assets/fixtures/fixture-3/Sample.module.scss"
      ),
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
        `Expected rename provider to edit file: ${expectedPath}`
      );
    }
  });
});

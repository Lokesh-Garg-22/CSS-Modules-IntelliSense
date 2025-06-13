import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import safeParser from "postcss-safe-parser";

const config = vscode.workspace.getConfiguration("cssModulesIntellisense");
const aliasMap = config.get<Record<string, string>>("aliases", {});

const supportedLangs = [
  "javascript",
  "typescript",
  "javascriptreact",
  "typescriptreact",
];
const supportedModuleFiles = ["css", "scss", "less"];

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cssModules");

  // Completion Provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    supportedLangs,
    {
      async provideCompletionItems(document, position) {
        const line = document.lineAt(position).text;
        const prefix = line.substring(0, position.character);
        const match = prefix.match(/(\w+)\.([\w-]*)$/);
        if (!match) {
          return;
        }

        const [_, varName] = match;
        const importRegex = new RegExp(
          `import\\s+${varName}\\s+from\\s+['"](.+\\.module\\.(css|scss|less))['"]`
        );
        const fullText = document.getText();
        const imp = fullText.match(importRegex);
        if (!imp) {
          return;
        }

        const importPath = imp[1];

        let resolvedPath = importPath;

        // Check for alias
        for (const [alias, relPath] of Object.entries(aliasMap)) {
          if (importPath.startsWith(alias)) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
              return;
            }

            const basePath = workspaceFolders[0].uri.fsPath;
            const absolute = path.join(
              basePath,
              relPath,
              importPath.slice(alias.length)
            );
            resolvedPath = absolute;
            break;
          }
        }

        // Resolve relative to file if not aliased
        if (!path.isAbsolute(resolvedPath)) {
          resolvedPath = path.resolve(
            path.dirname(document.uri.fsPath),
            resolvedPath
          );
        }

        if (!fs.existsSync(resolvedPath)) {
          return;
        }

        const classNames = await extractClassNames(resolvedPath);
        return classNames.map((name) => {
          const item = new vscode.CompletionItem(
            name,
            vscode.CompletionItemKind.Variable
          );
          item.detail = "CSS Module class";
          return item;
        });
      },
    },
    "." // trigger on dot
  );

  // Definition Provider
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    supportedLangs,
    {
      async provideDefinition(document, position) {
        const wordRange = document.getWordRangeAtPosition(position, /[\w-]+/);
        if (!wordRange) {
          return;
        }
        const className = document.getText(wordRange);

        // get the variable name before the dot
        const line = document.lineAt(position).text;
        const prefix = line.substring(0, wordRange.start.character);
        const varMatch = prefix.match(/(\w+)\.$/);
        if (!varMatch) {
          return;
        }

        const varName = varMatch[1];
        const importRegex = new RegExp(
          `import\\s+${varName}\\s+from\\s+['"](.+\\.module\\.(css|scss|less))['"]`
        );
        const fullText = document.getText();
        const imp = fullText.match(importRegex);
        if (!imp) {
          return;
        }

        const cssPath = path.resolve(path.dirname(document.uri.fsPath), imp[1]);
        if (!fs.existsSync(cssPath)) {
          return;
        }

        const cssDoc = await vscode.workspace.openTextDocument(cssPath);
        const text = cssDoc.getText();

        // find first occurrence of ".className"
        const regex = new RegExp(`\\.${className}\\b`);
        const match = regex.exec(text);
        if (!match) {
          return;
        }

        const offset = match.index;
        const pos = cssDoc.positionAt(offset);
        return new vscode.Location(cssDoc.uri, pos);
      },
    }
  );

  // RenameProvider
  const renameProvider = vscode.languages.registerRenameProvider(
    supportedModuleFiles,
    {
      async provideRenameEdits(document, position, newName, token) {
        const range = document.getWordRangeAtPosition(
          position,
          /\.[a-zA-Z0-9_-]+/
        );
        if (!range) {
          return;
        }

        const oldClassName = document.getText(range).replace(/^\./, "");
        const filePath = document.uri.fsPath;

        const edit = new vscode.WorkspaceEdit();

        const files = await vscode.workspace.findFiles("**/*.{ts,tsx,js,jsx}");

        await Promise.all(
          files.map(async (file) => {
            const doc = await vscode.workspace.openTextDocument(file);
            const text = doc.getText();
            const importRegex =
              /import\s+(\w+)\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;
            let match: RegExpExecArray | null;

            while ((match = importRegex.exec(text))) {
              const varName = match[1];
              const importPath = match[2];
              const resolvedPath = path.resolve(
                path.dirname(doc.uri.fsPath),
                importPath
              );

              if (resolvedPath !== filePath) {
                continue;
              }

              const usageRegex = new RegExp(
                `${varName}\\.${oldClassName}\\b`,
                "g"
              );
              let usageMatch: RegExpExecArray | null;

              while ((usageMatch = usageRegex.exec(text))) {
                const index =
                  usageMatch.index + usageMatch[0].indexOf(oldClassName);
                const pos = doc.positionAt(index);
                const usageRange = new vscode.Range(
                  pos,
                  pos.translate(0, oldClassName.length)
                );

                edit.replace(doc.uri, usageRange, newName);
              }
            }
          })
        );

        return edit;
      },

      prepareRename(document, position) {
        const range = document.getWordRangeAtPosition(
          position,
          /\.[a-zA-Z0-9_-]+/
        );
        if (range) {
          return range;
        }
        throw new Error("You can only rename CSS class selectors");
      },
    }
  );

  const checkDocument = async (document: vscode.TextDocument) => {
    if (!supportedLangs.includes(document.languageId)) {
      return;
    }

    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    const importRegex =
      /import\s+(\w+)\s+from\s+['"](.*?\.module\.(css|scss|less))['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(text))) {
      const varName = match[1];
      const importPath = match[2];

      const fullPath = path.resolve(
        path.dirname(document.uri.fsPath),
        importPath
      );
      if (!fs.existsSync(fullPath)) {
        continue;
      }
      const definedClasses = await extractClassNames(fullPath);

      const usageRegex = new RegExp(`${varName}\\.([a-zA-Z0-9_\-]+)`, "g");
      let usageMatch: RegExpExecArray | null;
      while ((usageMatch = usageRegex.exec(text))) {
        const fullMatch = usageMatch[0];
        const className = usageMatch[1];

        // Skip matches inside import statements
        const lineStart = text.lastIndexOf("\n", usageMatch.index) + 1;
        const lineEnd = text.indexOf("\n", usageMatch.index);
        const lineText = text.slice(
          lineStart,
          lineEnd === -1 ? undefined : lineEnd
        );

        if (/^\\s*import\\s+/.test(lineText)) {
          continue;
        }

        if (!definedClasses.includes(className)) {
          const index = usageMatch.index + fullMatch.indexOf(className);
          const pos = document.positionAt(index);
          const range = new vscode.Range(
            pos,
            pos.translate(0, className.length)
          );
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Class "${className}" is not defined in ${importPath}`,
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      }
    }

    diagnosticCollection.set(document.uri, diagnostics);
  };

  vscode.workspace.onDidOpenTextDocument(checkDocument);
  vscode.workspace.onDidChangeTextDocument((e) => checkDocument(e.document));
  vscode.workspace.textDocuments.forEach(checkDocument);

  context.subscriptions.push(
    completionProvider,
    definitionProvider,
    renameProvider
  );
}

async function extractClassNames(filePath: string): Promise<string[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const root = safeParser(content);
  const names = new Set<string>();

  root.walkRules((rule) => {
    const matches = rule.selector.match(/\.(\w[\w-]*)/g);
    if (matches) {
      matches.forEach((m) => names.add(m.slice(1)));
    }
  });

  return Array.from(names);
}

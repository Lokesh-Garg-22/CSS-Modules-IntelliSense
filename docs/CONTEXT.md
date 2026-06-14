# Project Context

This document describes what the extension does, how its pieces fit together, and
why key design decisions were made. Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
for the file layout.

## Overview

CSS/SCSS Modules IntelliSense is a VS Code extension that bridges CSS Module files
and their JavaScript/TypeScript consumers. It parses class name definitions from
`.module.css/scss/less/sass/styl/pcss` files, tracks which JS/TS files import
them, and uses that information to power diagnostics, autocompletion, go-to-definition,
and rename refactoring across the JS↔CSS boundary.

## Features

- **Diagnostics** — flags undefined class names in JS/TS files and (optionally)
  unused class names in CSS module files
- **Autocompletion** — suggests class names when typing `styles.` in JS/TS
- **Go-to-Definition** — navigates from a class usage in JS/TS to its definition
  in CSS, and from a class definition in CSS to all its usages in JS/TS
- **Rename** — renames a class name atomically across both the CSS module and all
  JS/TS files that use it; works from either side

## Cache Architecture

The extension uses a three-layer cache to avoid re-parsing files on every keystroke.

### PathMapCache (`src/types/cache.ts`)

An array of file path strings with a reverse lookup map. All other caches store
numeric indices rather than full path strings, which reduces memory overhead and
speeds up Map/Set operations. Every time a new path is encountered, it is appended
to this array and its index becomes the key used everywhere else.

### ModulePathCache (`src/types/cache.ts`)

Maps a CSS module's numeric index to the set of numeric indices of JS/TS files
that import it. This reverse dependency graph answers "what files import this
CSS module?" — required for the "class not used" diagnostic and for rename refactoring.

### ClassNameCache (`src/types/cache.ts`)

An LRU map from a CSS module's numeric index to a `ClassNameRangeMap`
(class name string → array of `vscode.Range`). LRU caps memory usage in projects
with many CSS modules; the cache size is configurable via `classNameCacheSize`
(default: 5). On a cache miss the file is parsed on demand.

### BaseCache (`src/types/cache.ts`)

The shared base class for `ModulePathCache` and `ClassNameCache`.
It exposes two access layers:

- **Direct index** — `set` / `get` / `setMap` operate on numeric indices; used by
  `loadCache` when restoring from disk
- **Path string** — `setByKey` / `getByKey` / `setMapByKey` translate a path string
  to its numeric index via `PathMapCache.getIndexFormKey`,
  auto-inserting new paths as needed

### Persistence (`src/libs/cache.ts`)

Caches are serialized to `cache.json` in VS Code's extension storage directory
(writes are debounced by 1000ms). On load, JSON keys are `Number()`-converted
back to numeric indices, and plain `{start, end}` objects are reconstructed into
proper `vscode.Range` instances before being stored.

## Data Flow

### Activation

1. Try to load caches from disk via `Cache.loadCache()`
2. If no cache exists, scan the workspace: `CssModuleDependencyCache.populateCacheFromWorkspace()`
   reads all JS/TS files and builds the import graph
3. Register persistent event listeners (`src/libs/loadCaches.ts`) and config-gated
   listeners (`src/libs/processConfig.ts`)
4. Push all currently open documents to the `CheckDocument` queue

### File open / edit / save

1. `CssModuleDependencyCache.updateCacheForDocument()` updates the import graph
   for the changed file
2. `CheckDocument.push(doc)` queues the document for validation
   (debounced 1ms between items)
3. `analyzeDocument` routes by language:
   - JS/TS → `analyzeScriptDocument`: checks that imported modules exist and
     that every used class name is defined
   - CSS module → `analyzeModuleDocument`: reports defined class names that are
     never used (if `classNotUsed` is enabled)

### CSS module edited

1. `ClassNameCache.updateClassNameCache()` re-parses the file (debounced 5000ms
   to avoid thrashing on rapid edits)
2. The CSS module itself is pushed to `CheckDocument` so the "class not used"
   check re-runs
3. All dependent JS/TS files are pushed to `CheckDocument` so their "class not defined"
   diagnostics update against the new class list

### Completion / Definition / Rename

- **Completion** — resolves which CSS module the cursor is accessing →
  `ClassNameCache.getClassNamesFromImportPath()` → completion list
- **Definition (JS→CSS)** — extracts the class name at the cursor →
  `ClassNameCache.getClassNameData()` → `LocationLink[]` pointing to the CSS definition
- **Definition (CSS→JS)** — finds all dependent JS/TS files → scans each for usages
  of the class → `LocationLink[]` pointing to every usage
- **Rename** — builds a `WorkspaceEdit` that updates the class name in the CSS module
  and in every dependent JS/TS file atomically

## Key Design Decisions

- **Numeric index indirection** — storing numeric indices instead of path strings
  saves memory and speeds up `Map`/`Set` operations in large projects
- **LRU for class names** — class name data is the largest per-file payload;
  LRU eviction keeps memory bounded without sacrificing correctness (a miss just re-parses on demand)
- **Lazy CSS parsing** — modules are not parsed until their class names are first
  needed, keeping activation fast
- **Debounce tiers** — `CheckDocument` uses 1ms (fast diagnostic feedback),
  `ClassNameCache` uses 5000ms (avoids re-parsing on every keystroke), persistence
  uses 1000ms (batches disk writes)
- **postcss-safe-parser** — tolerates syntactically invalid CSS/SCSS so the extension
  works correctly on incomplete or experimental files
- **`//` comment stripping** (`src/utils/sanitizeCssInput.ts`) — removes single-line
  comments before PostCSS parsing so that class name line numbers remain accurate
- **`classNotUsed` opt-in** — disabled by default because dynamic access patterns
  like `styles[someVar]` would produce false positives

## Configuration Reference

| Setting                                                       | Type    | Default                       | Description                                                |
| ------------------------------------------------------------- | ------- | ----------------------------- | ---------------------------------------------------------- |
| `cssModulesIntellisense.processOnEdit`                        | boolean | `true`                        | Run validation on every edit                               |
| `cssModulesIntellisense.processOnSave`                        | boolean | `true`                        | Run validation on save                                     |
| `cssModulesIntellisense.aliases`                              | object  | `{"~": "./src"}`              | Path aliases (webpack/tsconfig style)                      |
| `cssModulesIntellisense.blacklistPatterns`                    | array   | `["**/node_modules/**", ...]` | Glob patterns excluded from workspace scan                 |
| `cssModulesIntellisense.classNameCacheSize`                   | number  | `5`                           | Maximum CSS modules kept in the LRU class name cache       |
| `cssModulesIntellisense.diagnostics.classNotDefined.enabled`  | boolean | `true`                        | Enable the "class not defined" diagnostic in JS/TS files   |
| `cssModulesIntellisense.diagnostics.classNotDefined.severity` | enum    | `"warning"`                   | Severity of the "class not defined" diagnostic             |
| `cssModulesIntellisense.diagnostics.classNotUsed.enabled`     | boolean | `false`                       | Enable the "class not used" diagnostic in CSS module files |
| `cssModulesIntellisense.diagnostics.classNotUsed.severity`    | enum    | `"warning"`                   | Severity of the "class not used" diagnostic                |

## Module Map

### Entry point

| File               | Description                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `src/extension.ts` | Extension entry point; activates providers, registers commands, wires up event listeners                             |
| `src/config.ts`    | Constants: supported language IDs, debounce timers, message templates, configuration key strings, and default values |

### `src/libs/`

| File                          | Description                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `cache.ts`                    | Top-level `Cache` class; owns the three cache instances and handles serialization to/from `cache.json`                                 |
| `checkDocument.ts`            | Document validation queue; routes documents to `analyzeScriptDocument` (JS/TS) or `analyzeModuleDocument` (CSS) and writes diagnostics |
| `classNameCache.ts`           | Parses CSS module files with PostCSS, extracts class name ranges, and manages debounced cache updates                                  |
| `cssModuleDependencyCache.ts` | Maintains the reverse dependency graph (CSS module → importing JS/TS files); used by diagnostics and rename                            |
| `loadCaches.ts`               | Registers persistent event listeners for document open/change/delete to keep caches current                                            |
| `processConfig.ts`            | Registers or removes the `processOnEdit` / `processOnSave` event listeners based on user configuration                                 |
| `vsConfig.ts`                 | Typed getters for every extension setting; reads from the VS Code workspace configuration                                              |

### `src/providers/`

| File                    | Description                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `completionProvider.ts` | Provides class name completions when the user types `styles.` in a JS/TS file                        |
| `definitionProvider.ts` | Go-to-definition from JS/TS to CSS (class definition) and from CSS to JS/TS (all usages)             |
| `renameProvider.ts`     | Rename a class name across both the CSS module and all dependent JS/TS files; works from either side |

### `src/types/`

| File               | Description                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `cache.ts`         | Cache data structures: `PathMapCache`, `BaseCache`, `ModulePathCache`, `ModulePathCacheSet`, `ClassNameCache`, `ClassNameRangeMap` |
| `classNameData.ts` | Type for a single class name usage: position range, class name string, and the regex match object                                  |

### `src/utils/`

| File                         | Description                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `getAllClassNames.ts`        | Finds all `varName.className` usages in a document, skipping strings, comments, and nested property access |
| `getAllFiles.ts`             | Scans the workspace for all JS/TS and CSS module files, respecting `blacklistPatterns`                     |
| `getAllImportModulePaths.ts` | Extracts all CSS module import statements from a document (handles multiline imports)                      |
| `getDataOfClassName.ts`      | Finds every occurrence of a specific `varName.className` pattern in a document                             |
| `getFileExtensionRegex.ts`   | Builds regex-compatible extension strings for supported CSS and script file types                          |
| `getGrammar.ts`              | Loads a TextMate grammar for a given language scope                                                        |
| `getGrammarTokens.ts`        | Tokenizes a document line using TextMate grammars for comment/string detection                             |
| `getImportModulePath.ts`     | Given a cursor position and the import variable name, returns the CSS module import path                   |
| `getImportModuleVarName.ts`  | Extracts the variable name (e.g. `styles`) from the `varName.className` expression at the cursor           |
| `getPath.ts`                 | Path resolution utilities: alias expansion, workspace-relative paths, and import path normalization        |
| `getRegistry.ts`             | Initializes the vscode-textmate registry used for grammar-based tokenization                               |
| `isDocumentModule.ts`        | Returns whether a document is a CSS module file based on language ID and `.module.*` extension             |
| `isPositionInScope.ts`       | Checks whether a document position falls inside a comment or string using TextMate tokenization            |
| `sanitizeCssInput.ts`        | Strips `//` single-line comments from CSS input before PostCSS parsing                                     |

### `src/test/`

| File                                   | Description                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| `config.ts`                            | Exports the extension name and publisher constant used across tests                   |
| `extension.test.ts`                    | Top-level tests for extension activation and basic end-to-end behaviour               |
| `providers/completionProvider.test.ts` | Tests for the autocompletion feature                                                  |
| `providers/definitionProvider.test.ts` | Tests for go-to-definition in both directions                                         |
| `providers/renameProvider.test.ts`     | Tests for rename refactoring across JS/TS and CSS files                               |
| `utils/getRootPath.ts`                 | Traverses up from `__dirname` to find the project root (used to locate test fixtures) |
| `utils/utils.ts`                       | Shared test helpers: converts `vscode.Range` to a readable string for assertions      |

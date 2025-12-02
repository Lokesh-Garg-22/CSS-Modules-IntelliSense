# Project Structure

This document describes the organization of the
CSS/SCSS Modules IntelliSense VS Code extension.

## Directory Structure

```
css-modules-intellisense/
├── .github/                    # GitHub-specific files
│   └── workflows/              # GitHub Actions workflows
├── .vscode/                    # VS Code workspace settings
│   ├── extensions.json         # Recommended extensions
│   ├── launch.json             # Debug configurations
│   ├── settings.json           # Workspace settings
│   └── tasks.json              # Build tasks
├── assets/                     # Static assets
│   ├── fixtures/               # Test fixtures
│   └── images/                 # Images (icons, screenshots)
├── configuration/              # Language configuration files
│   ├── css-language-configuration.json
│   ├── default-language-configuration.json
│   ├── less-language-configuration.json
│   └── scss-language-configuration.json
├── dist/                       # Compiled output (generated)
├── docs/                       # Documentation
│   └── TODO.md                 # Tasks and known issues
├── node_modules/               # Dependencies (generated)
├── src/                        # Source code
│   ├── libs/                   # Core libraries
│   │   ├── cache.ts            # Main cache management
│   │   ├── checkDocument.ts    # Document validation
│   │   ├── classNameCache.ts   # Class name caching
│   │   ├── cssModuleDependencyCache.ts
│   │   ├── loadCaches.ts       # Cache initialization
│   │   └── processConfig.ts    # Configuration processing
│   ├── providers/              # Language feature providers
│   │   ├── completionProvider.ts    # Auto-completion
│   │   ├── definitionProvider.ts    # Go-to-definition
│   │   └── renameProvider.ts        # Symbol renaming
│   ├── test/                   # Test files
│   ├── types/                  # TypeScript type definitions
│   │   ├── cache.ts
│   │   └── classNameData.ts
│   ├── utils/                  # Utility functions
│   │   ├── getAllClassNames.ts
│   │   ├── getAllFiles.ts
│   │   ├── getAllImportModulePaths.ts
│   │   ├── getDataOfClassName.ts
│   │   ├── getFileExtensionRegex.ts
│   │   ├── getGrammar.ts
│   │   ├── getGrammarTokens.ts
│   │   ├── getImportModulePath.ts
│   │   ├── getImportModuleVarName.ts
│   │   ├── getPath.ts
│   │   ├── getRegistry.ts
│   │   ├── isDocumentModule.ts
│   │   ├── isPositionInComment.ts
│   │   ├── isPositionInString.ts
│   │   └── sanitizeCssInput.ts
│   ├── config.ts               # Extension configuration
│   └── extension.ts            # Extension entry point
├── syntaxes/                   # TextMate grammar files
│   ├── JavaScript.tmLanguage.json
│   ├── JavaScriptReact.tmLanguage.json
│   ├── TypeScript.tmLanguage.json
│   ├── TypeScriptReact.tmLanguage.json
│   ├── css.tmLanguage.json
│   ├── less.tmLanguage.json
│   └── scss.tmLanguage.json
├── .editorconfig               # Editor configuration
├── .gitignore                  # Git ignore rules
├── .markdownlint.json          # Markdown linting rules
├── .vscode-test.mjs            # VS Code test configuration
├── .vscodeignore               # Files to exclude from extension package
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT License
├── README.md                   # Project overview
├── eslint.config.mjs           # ESLint configuration
├── package.json                # Node.js package manifest
├── package-lock.json           # Locked dependencies
├── tsconfig.json               # TypeScript configuration
└── vsc-extension-quickstart.md # Quick start guide
```

## Key Directories

### `src/`

Main source code directory containing:

- **libs/**: Core functionality (caching, document processing)
- **providers/**: VS Code language feature providers
- **utils/**: Helper functions for various operations
- **types/**: TypeScript type definitions

### `configuration/`

Language configuration files for different CSS preprocessors (CSS, SCSS, LESS, etc.)

### `syntaxes/`

TextMate grammar files for syntax highlighting in JS/TS files

### `assets/`

Static resources including test fixtures and extension icons

## Build Output

- **dist/**: Compiled JavaScript files (created by `npm run compile`)
- **node_modules/**: Dependencies (created by `npm install`)

## Entry Points

- **Main Extension**: `src/extension.ts`
- **Compiled Output**: `dist/extension.js` (specified in `package.json`)

## Configuration Files

- `.editorconfig` - Code style consistency
- `tsconfig.json` - TypeScript compiler settings
- `eslint.config.mjs` - Linting rules
- `package.json` - Extension metadata and dependencies

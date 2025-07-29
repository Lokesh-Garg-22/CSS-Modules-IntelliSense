# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] – 2025-07-XX

### Fixed

- Inefficiencies in `isPositionInComment` and `isPositionInString` that caused
  slow parsing in large files.

## [0.1.2] – 2025-07-18

### Added

- Support for multiline CSS module import statements.

### Changed

- Improved class name detection logic to skip usages inside strings, comments,
  and nested property access (e.g., `temp.styles.class`) in
  JavaScript/TypeScript files.
- Refactored regular expressions for improved clarity and support for multiline imports.

### Fixed

- Autocompletion no longer triggers for chained or nested properties like `temp.styles.class`.
- Class name references inside strings or comments
  are now correctly ignored during detection.
- and some general performance improvements, including faster data loading
  and reduced memory usage.

## [0.1.1] – 2025-07-16

### Changed

- The `resetCache` command now processes files in series instead of in parallel,
  resolving issues caused by simultaneous parsing.

## [0.1.0] – 2025-07-11

### Added

- **Definition Provider**: Jump to definitions of class names in CSS module files.
- **Rename Provider**: Enables in-place renaming of `className` usages within scripts.
- **Caching**: Class names from module files are now cached to improve performance.
- **Error Handling**: Improved error reporting for missing module files during import.
- **Tests**: Added more unit tests for both the Definition and Rename Providers.

### Fixed

- **Comment Ignorance**: Class names inside comments were incorrectly
  considered valid — they are now ignored properly.

## [0.0.5] – 2025-07-02

### Added

- **Reset Cache Command:** Allows users to delete the existing cache and
  reload all files from the workspace.
- **Extension Development Tests:** Additional tests added to
  improve support during extension development.

## [0.0.4] – 2025-06-27

### Added

- The extension now caches all scripts and modules in the workspace to improve performance.

## [0.0.3] – 2025-06-23

### Fixed

- Fixed an issue where `npm run test` did not execute correctly.
- Prevented `node_modules` from being searched during rename operations.

## [0.0.2] – 2025-06-19

### Added

- The Definition Provider now returns all occurrences of class names within
  `.module` files.

### Fixed

- Class names were incorrectly recognized inside strings and comments.
- Rename Provider did not rename class names within the `.module` file itself.

## [0.0.1] – 2025-06-13

### Added

- Initial release of CSS Modules Linter.
- Linting for undefined class names in JavaScript and TypeScript files.
- Rename support across JavaScript/TypeScript and CSS Module files.
- Support for `.module.css`, `.module.scss`, and `.module.less` files.
- Go-to-Definition support for `styles.className` references.
- Autocompletion of class names in JavaScript and TypeScript.

[unreleased]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.5...v0.1.0
[0.0.5]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/releases/tag/v0.0.1

# Changelog

All notable changes to this project will be documented in this file.

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

[0.0.5]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/releases/tag/v0.0.1

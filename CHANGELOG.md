# Changelog

All notable changes to this project will be documented in this file.

---

## [unreleased] – 2025-06-XX

## [0.0.3] – 2025-06-23

### Fixed

- Fixed an issue where `npm run test` did not execute correctly.
- Prevented `node_modules` from being searched during rename operations.

## [0.0.2] – 2025-06-19

### Added

- Definition Provider now returns all definitions of class names within `.module` files.

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

[unreleased]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/releases/tag/v0.0.1

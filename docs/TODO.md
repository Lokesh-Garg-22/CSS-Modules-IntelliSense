# TODO

## Enhancements

- Add `cssModulesIntellisense.diagnostics.classNotDefined.enabled` (boolean) and
  `cssModulesIntellisense.diagnostics.classNotDefined.severity`
  (`"error" | "warning" | "info" | "hint"`)
  settings to control the "class not defined" diagnostic in `analyzeDocument`.

- Add `cssModulesIntellisense.diagnostics.classNotUsed.enabled` (boolean) and
  `cssModulesIntellisense.diagnostics.classNotUsed.severity`
  (`"error" | "warning" | "info" | "hint"`)
  settings to show a "Class 'x' is never used" diagnostic on CSS module files,
  by cross-referencing `ClassNameCache` against usage in all dependent JS/TS files
  via `CssModuleDependencyCache`.

## Known Issues

<!-- Add known issues here -->

## Future Improvements

<!-- Add future improvements here -->

# TODO

## Enhancements

<!-- Add enhancements here -->

## Known Issues

<!-- Add known issues here -->

## Future Improvements

- Add an extension setting to configure the class name cache size (LRU max entries).
  Currently hardcoded to 3, which causes frequent cache evictions and re-parsing
  in projects with more than 3 CSS module files. Should be user-configurable via
  `cssModules.classNameCacheSize` in extension settings.

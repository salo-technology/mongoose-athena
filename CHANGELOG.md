# Changelog

## 1.2.0 (8/1/2020)

### Major changes
- Return an empty array of results if search term is less than any field's `minSize` when sorting by relevancy.

### Bug fixes
- Fix bug which would cause empty `$or` queries to crash.

### Minor tweaks
- Added changelog
- Updated tests
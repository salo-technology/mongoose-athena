# Changelog
## 1.4.0 (24/4/2020)
- Updated dependencies

## 1.3.0 (9/1/2020)

### Major changes
- Made it so blank searches return an empty array

## 1.2.0 (8/1/2020)

### Major changes
- Return an empty array of results if search term is less than any field's `minSize` when sorting by relevancy.

### Bug fixes
- Fix bug which would cause empty `$or` queries to crash.

### Minor tweaks
- Added changelog
- Updated tests
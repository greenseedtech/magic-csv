## 4.1.0
- Bug fix for read/write errors
- Consolidated error codes into PARSE

## 4.0.0
- `err` is now a legit `Error` object
- Introduced standard `err.code` values
- Renamed `getColumn()` to `getCol()`
- Renamed `getColumns()` to `getCols()`
- Renamed `getColumnCount()` to `getColCount()`
- Renamed option `drop_empty_columns` to `drop_empty_cols`
- Renamed option `allow_single_column` to `allow_single_col`
- Renamed option `unknown_column_name` to `default_col_name`
- Renamed stat `valid_column_count` to `valid_col_count`
- Renamed stat `blank_column_count` to `blank_col_count`
- Renamed stat `added_column_count` to `added_col_count`
- Renamed stat `total_column_count` to `col_count`

## 3.0.0
- Added `drop_empty_columns` option
- Renamed option `exclude_bad_rows` to `drop_bad_rows`
- Renamed `getColCount()` to `getColumnCount()`

## 2.2.0
- Bug fix in parser logic

## 2.1.3
- Made `readObjects()` respect the trim option

## 2.1.0
- Added `getColCount()` and `getColumn()` methods
- Intelligent column sorting for `readObjects()`
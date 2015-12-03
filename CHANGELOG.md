## 6.0.0
- Added option `drop_empty_rows` which defaults to `true`

## 5.3.2
- Bug fix for nasty infinite loop

## 5.3.1
- Added `getRaw()` method

## 5.2.2
- Bug fix for fields that begin with ` "`

## 5.2.0
- Added option `drop_duplicate_rows`

## 5.1.0
- Added option `columns` for specifying column names
  - Not yet considered a stable feature

## 5.0.0
- Bug fixes in parsing logic
- Added option `strict_field_count`
  - Toggles on automatically if bad rows are detected

## 4.6.2
- Bug fix for column names containing the delimiter

## 4.6.0
- Improved duplicate column logic
  - Empty fields are filled with non-empty duplicate (if available)

## 4.5.0
- Added stat `duplicate_cols`

## 4.4.0
- Bug fixes in parser logic
- Improved "bad row" detection
- Duplicate columns are now preserved

## 4.3.0
- Added stat `empty_cols`
- Renamed stat `cols_dropped` to `dropped_col_count`
- Renamed stat `rows_dropped` to `dropped_row_count`

## 4.2.0
- Added stat `cols_dropped`
- Added stat `rows_dropped`

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

## 2.1.0
- Added `getColCount()` and `getColumn()` methods
- Improved column sorting for `readObjects()`
# magic-csv

magic-csv is an automagic CSV parser designed to handle *whatever* you throw at it

```javascript
MagicCSV = require("magic-csv");

csv = new MagicCSV({trim: true});

csv.readFile("example.csv", function(err, stats) {
  csv.getColumns(); // ["First Name", "Last Name", "Age"]
  csv.getRow(0); // ["Betty", "White", "93"]
  csv.getObject(0); // {"First Name": "Betty", "Last Name": "White", "Age": "93"}
  csv.getRow(-1); // last row
  csv.getRows(); // all rows
  csv.getObjects(); // all objects
  csv.getRowCount(); // total number of rows (same as stats.row_count)
  csv.getStats(); // stats object, info about how the file was parsed
});

// raw data example
csv.parse(data, function(err, stats) {
  // csv.whatever()
});
```

__Options__
```javascript
// passed to MagicCSV at instantiation (defaults shown)
{
  trim: true, // trim values
  exclude_bad_rows: false, // drop rows that don't line up with column heading
  allow_single_column: false, // don't return an error when there is only one column
  unknown_column_name: 'Unknown' // the name to use when columns are empty or created
}
```

__Stats__
```javascript
// example object returned by csv.getStats()
{
  line_ending: 'LF', // LF, CR, CRLF
  delimiter: 'comma', // comma, tab, pipe, none
  row_count: 1893,
  bad_row_indexes: [234, 759], // rows where column shifting may have occurred
  valid_column_count: 13, // column names found
  blank_column_count: 2, // blank column names repaired
  added_column_count: 1, // happens when a row splits into more fields then there are columns
  total_column_count: 14
}
```

# magic-csv

magic-csv is an automagic CSV parser designed to handle *whatever* you throw at it
<br>
<br>
__Usage__
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
  csv.getStats(); // stats object, detailing how the file was parsed
  csv.getRowCount(); // same as stats.row_count
  csv.getCSV(); // output as CSV
  csv.writeToStream(res); // write getCSV() to stream
});

// raw data example
csv.parse(data, function(err, stats) {
  // csv.whatever()
});
```
<br>
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
<br>
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
  added_column_count: 1, // columns added to cover extra fields
  total_column_count: 14
}
```
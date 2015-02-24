# magic-csv

magic-csv is an automagic CSV parser designed to handle *whatever* you throw at it
<br>
<br>
__Usage__
```javascript
MagicCSV = require("magic-csv");
csv = new MagicCSV({trim: true});

// file example
csv.readFile("example.csv", function(err, stats) {
  csv.getCols(); // ['First', 'Last', 'Pain']
  csv.getRow(0); // ['Brian', 'Regan', '8']
  csv.getObject(0); // {First: 'Brian', Last: 'Regan', Pain: '8'}
  csv.getStats(); // stats object, detailing how the file was parsed
  csv.getRowCount(); // same as stats.row_count
});

// objects example
var ob1 = {Name: 'Jimmy', Phone: 5552497, Gender: 'M'};
var ob2 = {Name: 'Justin', Phone: 5553546, Phone2: 5557951, Gender: 'M'};
csv.readObjects([ob1, ob2], function(err, stats) {
  csv.getCols(); // ['Name', 'Phone', 'Phone2', 'Gender']
  csv.getRow(0); // ['Jimmy', '5552497', '', 'M']
  csv.getRow(1); // ['Justin', '5553546', '5557951', 'M']
  csv.getCol('Phone'); // ['5552497', '5553546']
});

// raw example
csv.parse(str, function(err, stats) {
  csv.getRow(-1); // last row
  csv.getRows(); // all rows
  csv.getObjects(); // all objects
  csv.getColCount(); // same as stats.col_count
});

// write methods
csv.writeToStream(stream);
csv.writeToRes(res, 'out.csv'); // express response
csv.writeToFile('out.csv');
```
<br>
__Options__
```javascript
// passed to MagicCSV at instantiation (defaults shown)
{
  trim: true, // trim values
  drop_bad_rows: false, // drop rows with extra fields
  drop_empty_cols: false, // drop columns with no data
  allow_single_col: false, // allow input with only one column
  default_col_name: 'Unknown' // name for generated columns
}
```
<br>
__Stats__
```javascript
// example object returned by csv.getStats()
{
  line_ending: 'LF', // LF, CR, CRLF, n/a, unknown
  delimiter: 'comma', // comma, tab, pipe, n/a, unknown
  col_count: 14,
  row_count: 1893,
  empty_cols: ['Phone 3'],
  duplicate_cols: {St: ['St 2']}, // second occurance of St renamed to St 2
  bad_row_indexes: [234, 759], // column shifting may have occurred here
  valid_col_count: 13, // column names found
  blank_col_count: 2, // blank column names repaired
  added_col_count: 1, // columns added to cover extra fields
  dropped_col_count: 0,
  dropped_row_count: 2
}
```
<br>
__Errors__<br>
All `err` objects have a `code` property. Possible values are:
* INPUT
* READ
* WRITE
* PARSE
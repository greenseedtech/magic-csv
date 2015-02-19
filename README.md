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
  csv.getColumns(); // ['First', 'Last', 'Pain']
  csv.getRow(0); // ['Brian', 'Regan', '8']
  csv.getObject(0); // {First: 'Brian', Last: 'Regan', Pain: '8'}
  csv.getStats(); // stats object, detailing how the file was parsed
  csv.getRowCount(); // same as stats.row_count
});

// objects example
var ob1 = {Name: 'Jimmy', Phone: 5552497, Gender: 'M'};
var ob2 = {Name: 'Justin', Phone: 5553546, Phone2: 5557951, Gender: 'M'};
csv.readObjects([ob1, ob2], function(err, stats) {
  csv.getColumns(); // ['Name', 'Phone', 'Phone2', 'Gender']
  csv.getRow(0); // ['Jimmy', '5552497', '', 'M']
  csv.getRow(1); // ['Justin', '5553546', '5557951', 'M']
  csv.getColumn('Phone'); // ['5552497', '5553546']
});

// raw example
csv.parse(str, function(err, stats) {
  csv.getRow(-1); // last row
  csv.getRows(); // all rows
  csv.getObjects(); // all objects
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
  exclude_bad_rows: false, // drop rows with unknown columns
  allow_single_column: false, // allow input with only one column
  unknown_column_name: 'Unknown' // title for created/empty columns
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
  bad_row_indexes: [234, 759], // column shifting may have occurred here
  valid_column_count: 13, // column names found
  blank_column_count: 2, // blank column names repaired
  added_column_count: 1, // columns added to cover extra fields
  total_column_count: 14
}
```

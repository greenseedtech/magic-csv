var CSV,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = CSV = (function() {
  function CSV(settings) {
    var _base, _base1, _base2, _base3, _base4;
    this.settings = settings != null ? settings : {};
    this._init();
    if ((_base = this.settings).trim == null) {
      _base.trim = true;
    }
    if ((_base1 = this.settings).drop_bad_rows == null) {
      _base1.drop_bad_rows = false;
    }
    if ((_base2 = this.settings).drop_empty_columns == null) {
      _base2.drop_empty_columns = false;
    }
    if ((_base3 = this.settings).allow_single_column == null) {
      _base3.allow_single_column = false;
    }
    if ((_base4 = this.settings).unknown_column_name == null) {
      _base4.unknown_column_name = 'Unknown';
    }
  }

  CSV.prototype._init = function() {
    this._columns = [];
    this._rows = [];
    return this._stats = {
      line_ending: 'unknown',
      delimiter: 'unknown',
      row_count: null,
      bad_row_indexes: [],
      valid_column_count: null,
      blank_column_count: null,
      added_column_count: null,
      total_column_count: null
    };
  };

  CSV.prototype.getStats = function() {
    return this._stats;
  };

  CSV.prototype.getColumnCount = function() {
    return this._columns.length;
  };

  CSV.prototype.getRowCount = function() {
    return this._rows.length;
  };

  CSV.prototype.getColumns = function() {
    return this._columns;
  };

  CSV.prototype.getColumn = function(i) {
    var col, row, _i, _len, _ref, _ref1;
    if ((_ref = typeof i) !== 'number' && _ref !== 'string') {
      return null;
    }
    if (typeof i === 'string') {
      i = this._columns.indexOf(i);
      if (!(i > -1)) {
        return null;
      }
    }
    if (i < 0) {
      i = this.getColumnCount() + i;
    }
    col = [];
    _ref1 = this._rows;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      row = _ref1[_i];
      col.push(row[i]);
    }
    return col;
  };

  CSV.prototype.getRows = function() {
    return this._rows;
  };

  CSV.prototype.getRow = function(i) {
    if (typeof i !== 'number') {
      return null;
    }
    if (i < 0) {
      i = this.getRowCount() + i;
    }
    if (this._rows[i] == null) {
      return null;
    }
    return this._rows[i];
  };

  CSV.prototype.getObjects = function() {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.getRowCount(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push(this.getObject(i));
    }
    return _results;
  };

  CSV.prototype.getObject = function(i) {
    var column, j, ob, row, _i, _len, _ref;
    row = this.getRow(i);
    if (row == null) {
      return null;
    }
    ob = {};
    _ref = this._columns;
    for (j = _i = 0, _len = _ref.length; _i < _len; j = ++_i) {
      column = _ref[j];
      if (row[j] != null) {
        ob[column] = row[j];
      }
    }
    return ob;
  };

  CSV.prototype.toString = function() {
    var data, line, row, val, _i, _j, _len, _len1, _ref;
    if (!(this._columns.length > 0)) {
      return '';
    }
    data = '"' + this._columns.join('","') + '"';
    _ref = this._rows;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      line = '\n"';
      for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
        val = row[_j];
        line += val.replace(/\n/g, '\r').replace(/"/g, '""') + '","';
      }
      data += line.slice(0, -2);
    }
    return data;
  };

  CSV.prototype.writeToStream = function(stream, callback) {
    return stream.write(this.toString(), function() {
      return stream.end(null, function() {
        return typeof callback === "function" ? callback() : void 0;
      });
    });
  };

  CSV.prototype.writeToRes = function(res, filename, callback) {
    var headers;
    if (filename == null) {
      filename = 'data.csv';
    }
    if (typeof res.set === 'function') {
      headers = {
        'Content-Type': 'text/csv',
        'Content-Disposition': "attachment;filename=" + filename
      };
      res.set(headers);
    }
    return this.writeToStream(res, callback);
  };

  CSV.prototype.readFile = function(path, callback) {
    var data, stream;
    data = '';
    return stream = require('fs').createReadStream(path).on('data', function(chunk) {
      return data += chunk;
    }).on('error', function(err) {
      return typeof callback === "function" ? callback(err) : void 0;
    }).on('end', (function(_this) {
      return function() {
        return _this.parse(data, function(err, stats) {
          return typeof callback === "function" ? callback(err, stats) : void 0;
        });
      };
    })(this));
  };

  CSV.prototype.writeToFile = function(path, callback) {
    return require('fs').writeFile(path, this.toString(), function(err) {
      return typeof callback === "function" ? callback(err) : void 0;
    });
  };

  CSV.prototype.readObjects = function(data, callback) {
    var bestIndex, col, i, key, keys, new_val, ob, row, val, _i, _j, _k, _l, _len, _len1, _len2, _len3;
    if (!(this._isArray(data) && data.length > 0)) {
      return callback('Input was not an array of objects');
    }
    for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
      ob = data[i];
      if (!this._isObject(ob)) {
        return callback("Input at index " + i + " was not an object");
      }
    }
    this._init();
    bestIndex = (function(_this) {
      return function(cols, col) {
        var len, regex, _j, _k, _l, _len1, _len2, _ref, _ref1, _ref2;
        if (_this._columns.length === 0) {
          return 0;
        }
        if (col.length > 2) {
          for (len = _j = _ref = col.length - 2; _ref <= 2 ? _j <= 2 : _j >= 2; len = _ref <= 2 ? ++_j : --_j) {
            regex = new RegExp('^' + col.substr(0, len));
            _ref1 = _this._columns.slice().reverse();
            for (i = _k = 0, _len1 = _ref1.length; _k < _len1; i = ++_k) {
              col = _ref1[i];
              if (col.match(regex) != null) {
                return -i;
              }
            }
          }
        }
        _ref2 = cols.slice().reverse();
        for (i = _l = 0, _len2 = _ref2.length; _l < _len2; i = ++_l) {
          col = _ref2[i];
          if (__indexOf.call(_this._columns, col) < 0) {
            return -i;
          }
        }
      };
    })(this);
    this._columns = Object.keys(data[0]);
    for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
      ob = data[_j];
      keys = Object.keys(ob);
      for (_k = 0, _len2 = keys.length; _k < _len2; _k++) {
        col = keys[_k];
        if (__indexOf.call(this._columns, col) >= 0) {
          continue;
        }
        this._columns.splice(bestIndex(keys, col), 0, col);
      }
    }
    for (_l = 0, _len3 = data.length; _l < _len3; _l++) {
      ob = data[_l];
      row = [];
      for (key in ob) {
        val = ob[key];
        new_val = '';
        if (this._isObject(val) || this._isArray(val)) {
          new_val = JSON.stringify(val);
        } else if (typeof val.toString === 'function') {
          new_val = val.toString();
        }
        row[this._columns.indexOf(key)] = new_val;
      }
      this._rows.push(row);
    }
    this._finalize();
    this._stats.line_ending = 'n/a';
    this._stats.delimiter = 'n/a';
    return callback(null, this._stats);
  };

  CSV.prototype.parse = function(data, callback) {
    var allow_row, bad_rows, char, char_counts, cols, delimiter, delimiter_types, end, end_index, ending, ends, generated_col_count, getNextColumnName, i, index, j, line, line_ending, line_index, max_field_count, min_field_count, min_index, name, new_row, newline_flag, quoted, row, seek, start, start_index, starts, v, val, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _o, _p, _ref, _ref1, _ref2, _ref3;
    if (typeof data !== 'string') {
      return callback('Input was not a string');
    }
    this._init();
    generated_col_count = 0;
    getNextColumnName = (function(_this) {
      return function() {
        var col_name, i;
        generated_col_count++;
        i = 1;
        while (true) {
          col_name = "" + _this.settings.unknown_column_name + " " + (i++);
          if (__indexOf.call(_this._columns, col_name) < 0) {
            return col_name;
          }
        }
      };
    })(this);
    data = data.trim();
    min_index = null;
    _ref = {
      'CRLF': '\r\n',
      'LF': '\n',
      'CR': '\r'
    };
    for (name in _ref) {
      ending = _ref[name];
      i = data.indexOf(ending);
      if (i > 0 && ((min_index == null) || i < min_index)) {
        min_index = i;
        line_ending = ending;
        this._stats.line_ending = name;
      }
    }
    newline_flag = '{{{magic-csv}}}';
    if (line_ending !== '\r\n') {
      data = data.replace(/\r\n/g, newline_flag);
    }
    data = data.split(line_ending);
    if (!(data.length > 1)) {
      return callback('Line ending detection failed');
    }
    cols = data.shift().trim();
    char_counts = {};
    delimiter_types = {
      ',': 'comma',
      '|': 'pipe',
      '\t': 'tab'
    };
    for (char in delimiter_types) {
      name = delimiter_types[char];
      char_counts[name] = cols.split(char).length - 1;
    }
    delimiter = '\t';
    if (char_counts.comma > char_counts.tab) {
      delimiter = ',';
    }
    if ((char_counts.comma < (_ref1 = char_counts.pipe) && _ref1 > char_counts.tab)) {
      delimiter = '|';
    }
    cols = cols.split(delimiter);
    if (!(cols.length > 1 || this.settings.allow_single_column === true)) {
      return callback('Delimiter detection failed');
    }
    this._stats.delimiter = cols.length === 1 ? 'none' : delimiter_types[delimiter];
    while (cols[cols.length - 1] === '') {
      cols.pop();
    }
    this._columns = cols;
    for (i = _i = 0, _len = cols.length; _i < _len; i = ++_i) {
      val = cols[i];
      val = val.replace(/^"|"$/g, '').trim();
      if (val === '') {
        cols[i] = getNextColumnName();
      } else {
        cols[i] = val;
      }
    }
    if (generated_col_count / cols.length >= .5) {
      return callback('Column names not found');
    }
    this._stats.valid_column_count = cols.length;
    this._stats.blank_column_count = generated_col_count;
    bad_rows = [];
    min_field_count = null;
    max_field_count = 0;
    for (line_index = _j = 0, _len1 = data.length; _j < _len1; line_index = ++_j) {
      line = data[line_index];
      if (line.trim() === '') {
        continue;
      }
      row = line.split(delimiter);
      starts = [];
      ends = [];
      seek = false;
      for (i = _k = 0, _len2 = row.length; _k < _len2; i = ++_k) {
        val = row[i];
        start = false;
        end = false;
        val = val.replace(/\r/g, '\n').replace(new RegExp(newline_flag, 'g'), '\n');
        v = val.trim();
        if (!seek && ((v.match(/^"/) != null) && (v.match(/^""[^"]/) == null)) && ((v.match(/"$/) == null) || (v.match(/[^"]""$/) != null)) && (v.match(/[^"]{1}"[^"]{1}/) == null)) {
          start = true;
          seek = true;
          starts.push(i);
        }
        if (seek && ((v.match(/"$/) != null) && (v.match(/[^"]""$/) == null)) && ((v.match(/^"/) == null) || (v.match(/^""[^"]/) != null))) {
          end = true;
          seek = false;
          ends.push(i);
        }
        if (v === '"' || v === '"""') {
          if (seek) {
            ends.push(i);
          } else {
            starts.push(i);
          }
          seek = !seek;
        }
        quoted = (v.match(/^"/) != null) && (v.match(/"$/) != null);
        if (start || quoted) {
          val = val.replace(/^[\n]*"/, '');
        }
        if (end || quoted) {
          val = val.replace(/"[\n]*$/, '');
        }
        row[i] = val;
      }
      while (row.length > cols.length && row[row.length - 1] === '') {
        row.pop();
      }
      if (seek && row.length !== cols.length) {
        if (data[line_index + 1] != null) {
          data[line_index + 1] = line + newline_flag + data[line_index + 1];
        }
        continue;
      }
      if (starts.length > 0) {
        new_row = [];
        index = 0;
        for (i = _l = 0, _len3 = starts.length; _l < _len3; i = ++_l) {
          start_index = starts[i];
          end_index = ends[i];
          for (j = _m = index; index <= start_index ? _m < start_index : _m > start_index; j = index <= start_index ? ++_m : --_m) {
            new_row.push(row[j]);
          }
          index = end_index + 1;
          new_row.push(row.slice(start_index, end_index + 1).join(delimiter));
        }
        for (i = _n = index, _ref2 = row.length; index <= _ref2 ? _n < _ref2 : _n > _ref2; i = index <= _ref2 ? ++_n : --_n) {
          if (row[i] != null) {
            new_row.push(row[i]);
          }
        }
        row = new_row;
      }
      for (i = _o = 0, _len4 = row.length; _o < _len4; i = ++_o) {
        val = row[i];
        row[i] = val.replace(/""/g, '"');
      }
      allow_row = true;
      if (row.length > cols.length) {
        bad_rows.push(row);
        this._stats.bad_row_indexes.push(line_index);
        if (this.settings.drop_bad_rows === true) {
          allow_row = false;
        }
      }
      if (allow_row) {
        this._rows.push(row);
        if ((max_field_count == null) || row.length < min_field_count) {
          min_field_count = row.length;
        }
        if (row.length > max_field_count) {
          max_field_count = row.length;
        }
      }
    }
    while (max_field_count > cols.length) {
      cols.push(getNextColumnName());
    }
    if (generated_col_count / cols.length >= .5) {
      return callback('Too many unknown columns');
    }
    if (bad_rows.length === this._rows.length) {
      this._stats.bad_row_indexes.length = 0;
      if (this.settings.drop_bad_rows === true) {
        this._rows = bad_rows;
      }
    }
    if (this.settings.drop_bad_rows !== true && max_field_count > min_field_count) {
      _ref3 = this._rows;
      for (_p = 0, _len5 = _ref3.length; _p < _len5; _p++) {
        row = _ref3[_p];
        while (row.length < max_field_count) {
          row.push('');
        }
      }
    }
    this._finalize();
    this._stats.added_column_count = generated_col_count - this._stats.blank_column_count;
    return callback(null, this._stats);
  };

  CSV.prototype._isArray = function(v) {
    return typeof v === 'object' && v.constructor === Array;
  };

  CSV.prototype._isObject = function(v) {
    return typeof v === 'object' && v.constructor === Object;
  };

  CSV.prototype._finalize = function() {
    var col, empty, i, indexes, row, val, vals, _base, _base1, _base2, _base3, _base4, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _ref, _ref1, _ref2;
    _ref = this._rows;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      for (i = _j = 0, _len1 = row.length; _j < _len1; i = ++_j) {
        val = row[i];
        if (val == null) {
          val = '';
        }
        if (this.settings.trim === true) {
          val = val.trim();
        }
        row[i] = val;
      }
      while (row.length < this._columns.length) {
        row.push('');
      }
    }
    if (this.settings.drop_empty_columns === true) {
      indexes = [];
      _ref1 = this._columns;
      for (i = _k = 0, _len2 = _ref1.length; _k < _len2; i = ++_k) {
        col = _ref1[i];
        vals = this.getColumn(i);
        empty = true;
        for (_l = 0, _len3 = vals.length; _l < _len3; _l++) {
          val = vals[_l];
          if (val.trim() !== '') {
            empty = false;
            break;
          }
        }
        if (empty) {
          indexes.push(i);
        }
      }
      if (indexes.length > 0) {
        indexes = indexes.reverse();
        for (_m = 0, _len4 = indexes.length; _m < _len4; _m++) {
          i = indexes[_m];
          this._columns.splice(i, 1);
        }
        _ref2 = this._rows;
        for (_n = 0, _len5 = _ref2.length; _n < _len5; _n++) {
          row = _ref2[_n];
          for (_o = 0, _len6 = indexes.length; _o < _len6; _o++) {
            i = indexes[_o];
            row.splice(i, 1);
          }
        }
      }
    }
    if ((_base = this._stats).row_count == null) {
      _base.row_count = this._rows.length;
    }
    if ((_base1 = this._stats).valid_column_count == null) {
      _base1.valid_column_count = this._columns.length;
    }
    if ((_base2 = this._stats).blank_column_count == null) {
      _base2.blank_column_count = 0;
    }
    if ((_base3 = this._stats).added_column_count == null) {
      _base3.added_column_count = 0;
    }
    return (_base4 = this._stats).total_column_count != null ? _base4.total_column_count : _base4.total_column_count = this._columns.length;
  };

  return CSV;

})();

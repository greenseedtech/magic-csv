var CSV,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

module.exports = CSV = (function() {
  function CSV(settings) {
    var _base, _base1, _base2, _base3;
    this.settings = settings != null ? settings : {};
    this._init();
    if ((_base = this.settings).trim == null) {
      _base.trim = true;
    }
    if ((_base1 = this.settings).exclude_bad_rows == null) {
      _base1.exclude_bad_rows = false;
    }
    if ((_base2 = this.settings).allow_single_column == null) {
      _base2.allow_single_column = false;
    }
    if ((_base3 = this.settings).unknown_column_name == null) {
      _base3.unknown_column_name = 'Unknown';
    }
  }

  CSV.prototype._init = function() {
    this._columns = [];
    this._rows = [];
    return this._stats = {
      line_ending: 'Unknown',
      delimiter: 'Unknown',
      row_count: 0,
      bad_row_indexes: [],
      valid_column_count: 0,
      blank_column_count: 0,
      added_column_count: 0,
      total_column_count: 0
    };
  };

  CSV.prototype.getStats = function() {
    return this._stats;
  };

  CSV.prototype.getColumns = function() {
    return this._columns;
  };

  CSV.prototype.getRow = function(i) {
    if (i < 0) {
      i = this.getRowCount() + i;
    }
    if (this._rows[i] == null) {
      return null;
    }
    return this._rows[i];
  };

  CSV.prototype.getRows = function() {
    return this._rows;
  };

  CSV.prototype.getRowCount = function() {
    return this._rows.length;
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

  CSV.prototype.getObjects = function() {
    var i, _i, _ref, _results;
    _results = [];
    for (i = _i = 0, _ref = this.getRowCount(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push(this.getObject(i));
    }
    return _results;
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

  CSV.prototype.parse = function(data, callback) {
    var allow_row, bad_rows, char, char_count, col_count, cols, count, delimiter, end, end_index, ending, ending_count, ends, generated_col_count, getNextColumnName, i, index, j, line, line_ending, line_index, max_field_count, min_field_count, name, new_row, quoted, row, seek, start, start_index, starts, type, v, val, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
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
    line_ending = '\n';
    ending_count = 0;
    data = data.trim();
    _ref = {
      'Windows': '\r\n',
      'Unix': '\n',
      'Mac': '\r'
    };
    for (name in _ref) {
      ending = _ref[name];
      count = (_ref1 = data.match(new RegExp(ending, 'g'))) != null ? _ref1.length : void 0;
      if (count > ending_count) {
        ending_count = count;
        line_ending = ending;
        this._stats.line_ending = name;
      }
    }
    data = data.split(line_ending);
    if (!(data.length > 1)) {
      return callback('Line ending detection failed');
    }
    cols = data.shift().trim();
    char_count = {};
    _ref2 = {
      commas: ',',
      pipes: '|',
      tabs: '\t'
    };
    for (type in _ref2) {
      char = _ref2[type];
      char_count[type] = (cols + '').split(char).length - 1;
    }
    delimiter = '\t';
    if (char_count.commas > char_count.tabs) {
      delimiter = ',';
    }
    if ((char_count.commas < (_ref3 = char_count.pipes) && _ref3 > char_count.tabs)) {
      delimiter = '|';
    }
    cols = cols.split(delimiter);
    if (!(cols.length > 1 || this.settings.allow_single_column === true)) {
      return callback('Delimiter detection failed');
    }
    this._stats.delimiter = (function() {
      switch (delimiter) {
        case ',':
          return 'Comma';
        case '|':
          return 'Pipe';
        case '\t':
          return 'Tab';
      }
    })();
    while (cols[cols.length - 1] === '') {
      cols.pop();
    }
    col_count = cols.length;
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
    if (generated_col_count / col_count >= .5) {
      return callback('Column names not found');
    }
    this._stats.valid_column_count = col_count;
    this._stats.blank_column_count = generated_col_count;
    bad_rows = [];
    min_field_count = null;
    max_field_count = 0;
    for (line_index = _j = 0, _len1 = data.length; _j < _len1; line_index = ++_j) {
      line = data[line_index];
      row = line.split(delimiter);
      starts = [];
      ends = [];
      seek = false;
      for (i = _k = 0, _len2 = row.length; _k < _len2; i = ++_k) {
        val = row[i];
        start = false;
        end = false;
        v = val.trim();
        if (!seek && ((v.match(/^"/) != null) && (v.match(/^""[^"]/) == null)) && ((v.match(/"$/) == null) || (v.match(/[^"]""$/) != null)) && (v.match(/[^"]{3}"[^"]{3}/) == null)) {
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
          val = val.replace(/^"/, '');
        }
        if (end || quoted) {
          val = val.replace(/"$/, '');
        }
        row[i] = val;
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
        for (j = _n = index, _ref4 = row.length; index <= _ref4 ? _n < _ref4 : _n > _ref4; j = index <= _ref4 ? ++_n : --_n) {
          new_row.push(row[j]);
        }
        row = new_row;
      }
      for (i = _o = 0, _len4 = row.length; _o < _len4; i = ++_o) {
        val = row[i];
        row[i] = val.replace(/""/g, '"');
      }
      while (row.length > col_count && row[row.length - 1] === '') {
        row.pop();
      }
      while (row.length < col_count) {
        row.push('');
      }
      if (this.settings.trim === true) {
        for (i = _p = 0, _len5 = row.length; _p < _len5; i = ++_p) {
          val = row[i];
          row[i] = val.trim();
        }
      }
      allow_row = true;
      if (row.length > col_count) {
        bad_rows.push(row);
        this._stats.bad_row_indexes.push(line_index);
        if (this.settings.exclude_bad_rows === true) {
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
    if (generated_col_count / col_count >= .5) {
      return callback('Too many unknown columns');
    }
    if (bad_rows.length === this._rows.length) {
      this._stats.bad_row_indexes.length = 0;
      if (this.settings.exclude_bad_rows === true) {
        this._rows = bad_rows;
      }
    }
    if (this.settings.exclude_bad_rows !== true && max_field_count > min_field_count) {
      _ref5 = this._rows;
      for (_q = 0, _len6 = _ref5.length; _q < _len6; _q++) {
        row = _ref5[_q];
        while (row.length < max_field_count) {
          row.push('');
        }
      }
    }
    this._stats.added_column_count = generated_col_count - this._stats.blank_column_count;
    this._stats.total_column_count = cols.length;
    this._stats.row_count = this._rows.length;
    return callback(null, this._stats);
  };

  return CSV;

})();

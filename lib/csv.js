var CSV, clone, isArray, isObject, remove,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

CSV = (function() {
  function CSV(settings) {
    var _base, _base1, _base2, _base3, _base4, _base5, _base6, _base7;
    this.settings = settings != null ? settings : {};
    this._init();
    if ((_base = this.settings).trim == null) {
      _base.trim = true;
    }
    if ((_base1 = this.settings).drop_bad_rows == null) {
      _base1.drop_bad_rows = false;
    }
    if ((_base2 = this.settings).drop_empty_rows == null) {
      _base2.drop_empty_rows = true;
    }
    if ((_base3 = this.settings).drop_duplicate_rows == null) {
      _base3.drop_duplicate_rows = false;
    }
    if ((_base4 = this.settings).drop_empty_cols == null) {
      _base4.drop_empty_cols = false;
    }
    if ((_base5 = this.settings).allow_single_col == null) {
      _base5.allow_single_col = false;
    }
    if ((_base6 = this.settings).strict_field_count == null) {
      _base6.strict_field_count = false;
    }
    if ((_base7 = this.settings).default_col_name == null) {
      _base7.default_col_name = 'Unknown';
    }
    if (!isArray(this.settings.columns)) {
      this.settings.columns = null;
    }
  }

  CSV.prototype._init = function() {
    this._columns = [];
    this._rows = [];
    this._stats = {
      line_ending: 'unknown',
      delimiter: 'unknown',
      col_count: null,
      row_count: null,
      empty_cols: [],
      duplicate_cols: {},
      bad_row_indexes: [],
      valid_col_count: null,
      blank_col_count: null,
      added_col_count: null,
      dropped_col_count: 0,
      dropped_row_count: 0
    };
    this._blank_cols = [];
    return this._added_cols = [];
  };

  CSV.prototype.getRaw = function() {
    return this._raw;
  };

  CSV.prototype.getStats = function() {
    return this._stats;
  };

  CSV.prototype.getColCount = function() {
    return this._columns.length;
  };

  CSV.prototype.getRowCount = function() {
    return this._rows.length;
  };

  CSV.prototype.getCols = function() {
    return this._columns;
  };

  CSV.prototype.getCol = function(i) {
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
      i = this.getColCount() + i;
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
    if (this.getRowCount() === 0) {
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
    var stream;
    this._raw = '';
    return stream = require('fs').createReadStream(path).on('data', (function(_this) {
      return function(chunk) {
        return _this._raw += chunk;
      };
    })(this)).on('error', (function(_this) {
      return function(err) {
        return typeof callback === "function" ? callback(_this._err('Unable to read ' + path, 'READ')) : void 0;
      };
    })(this)).on('end', (function(_this) {
      return function() {
        return _this.parse(_this._raw, function(err, stats) {
          return typeof callback === "function" ? callback(err, stats) : void 0;
        });
      };
    })(this));
  };

  CSV.prototype.writeToFile = function(path, callback) {
    return require('fs').writeFile(path, this.toString(), (function(_this) {
      return function(err) {
        if (err != null) {
          return typeof callback === "function" ? callback(_this._err('Unable to write ' + path, 'WRITE')) : void 0;
        }
        return typeof callback === "function" ? callback() : void 0;
      };
    })(this));
  };

  CSV.prototype.readObjects = function(data, callback) {
    var bestIndex, col, i, key, keys, new_val, ob, row, val, _i, _j, _k, _l, _len, _len1, _len2, _len3;
    if (!(isArray(data) && data.length > 0)) {
      return callback(this._err('Input was not an array of objects', 'INPUT'));
    }
    for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
      ob = data[i];
      if (!isObject(ob)) {
        return callback(this._err("Input at index " + i + " was not an object", 'INPUT'));
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
        if (isObject(val) || isArray(val)) {
          new_val = JSON.stringify(val);
        } else if (typeof val.toString === 'function') {
          new_val = val.toString();
        }
        row[this._columns.indexOf(key)] = new_val;
      }
      this._rows.push(row);
    }
    return this._finalize((function(_this) {
      return function() {
        _this._stats.line_ending = 'n/a';
        _this._stats.delimiter = 'n/a';
        return callback(null, _this._stats);
      };
    })(this));
  };

  CSV.prototype.parse = function(data, callback) {
    var allow_row, bad_rows, char, col, col_delimiter, cols, cols_found, count, delimiter, delimiter_types, dup_cols, end, end_index, ending, ends, first_row, getNextColumnName, i, index, j, line, line_ending, line_index, line_seek_count, max_char_count, max_field_count, min_field_count, min_index, name, new_col, new_row, newline_flag, quoted, row, seek, start, start_index, starts, v, val, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _o, _p, _ref, _ref1, _ref2;
    if (typeof data !== 'string') {
      return callback(this._err('Input was not a string', 'INPUT'));
    }
    this._data = data;
    this._init();
    getNextColumnName = (function(_this) {
      return function(name) {
        var col_name, i;
        if (name == null) {
          name = _this.settings.default_col_name;
        }
        i = __indexOf.call(_this._columns, name) >= 0 ? 2 : 1;
        while (true) {
          col_name = "" + name + " " + (i++);
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
    if (!(data.length > 1 || (this.settings.columns != null))) {
      return callback(this._err('Line ending detection failed (no rows)'));
    }
    cols = data.shift();
    first_row = cols;
    delimiter_types = {
      ',': 'comma',
      '|': 'pipe',
      '\t': 'tab',
      ';': 'semicolon'
    };
    max_char_count = 0;
    for (char in delimiter_types) {
      name = delimiter_types[char];
      count = cols.split(char).length - 1;
      if (count > max_char_count) {
        delimiter = char;
        max_char_count = count;
      }
    }
    col_delimiter = cols.trim().substr(0, 1) === '"' ? '"' + delimiter + '"' : delimiter;
    cols = cols.split(col_delimiter);
    if (!(cols.length > 1 || this.settings.allow_single_col === true)) {
      return callback(this._err('Delimiter detection failed (no columns)'));
    }
    this._stats.delimiter = cols.length === 1 ? 'n/a' : delimiter_types[delimiter];
    if (this.settings.columns != null) {
      cols = this.settings.columns;
      data.unshift(first_row);
    }
    this._columns = cols;
    cols_found = [];
    dup_cols = {};
    for (i = _i = 0, _len = cols.length; _i < _len; i = ++_i) {
      col = cols[i];
      col = col.trim().replace(/^"|"$/g, '').trim();
      if (col === '') {
        cols[i] = getNextColumnName();
        this._blank_cols.push(cols[i]);
      } else {
        if (__indexOf.call(cols_found, col) >= 0) {
          new_col = getNextColumnName(col);
          if (dup_cols[col] == null) {
            dup_cols[col] = [];
          }
          dup_cols[col].push(new_col);
          col = new_col;
        }
        cols[i] = col;
        cols_found.push(col);
      }
    }
    this._stats.valid_col_count = cols_found.length;
    this._stats.duplicate_cols = dup_cols;
    if (this._blank_cols.length / cols.length >= .5 && this.settings.allow_single_col !== true) {
      return callback(this._err('Column name detection failed'));
    }
    bad_rows = [];
    min_field_count = null;
    max_field_count = 0;
    line_seek_count = 0;
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
        v = val.match(/^ "/) != null ? ' ' + val.trim() : val.trim();
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
      if (seek || this.settings.strict_field_count === true) {
        if (row.length - cols.length === 1 && row[row.length - 1] === '' && this.settings.strict_field_count !== true) {
          starts.pop();
        } else if (row.length !== cols.length) {
          if (line_seek_count++ > 200) {
            return callback(this._err('Field terminator not found'));
          }
          if (data[line_index + 1] != null) {
            data[line_index + 1] = line + newline_flag + data[line_index + 1];
          }
          continue;
        }
      }
      line_seek_count = 0;
      if (starts.length > 0 && ends.length > 0) {
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
        for (i = _n = index, _ref1 = row.length; index <= _ref1 ? _n < _ref1 : _n > _ref1; i = index <= _ref1 ? ++_n : --_n) {
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
      while (row.length > cols.length && row[row.length - 1] === '') {
        row.pop();
      }
      allow_row = true;
      if (row.length > cols.length || row.length < cols.length - 2) {
        bad_rows.push(row);
        this._stats.bad_row_indexes.push(line_index);
        if (this.settings.drop_bad_rows === true) {
          allow_row = false;
          this._stats.dropped_row_count++;
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
    if (max_field_count > 10000) {
      return callback(this._err('Column shifting detected'));
    }
    while (max_field_count > cols.length) {
      col = getNextColumnName();
      this._added_cols.push(col);
      cols.push(col);
    }
    if (this._added_cols.length / cols.length >= .5) {
      return callback(this._err('Column shifting detected'));
    }
    if (bad_rows.length > 0 && this._rows.length === 0) {
      this._stats.dropped_row_count = 0;
      this._stats.bad_row_indexes.length = 0;
      if (this.settings.drop_bad_rows === true) {
        this._rows = bad_rows;
      }
    }
    this._stats.dropped_row_count += line_seek_count;
    if (this.settings.drop_bad_rows !== true && max_field_count > min_field_count) {
      _ref2 = this._rows;
      for (_p = 0, _len5 = _ref2.length; _p < _len5; _p++) {
        row = _ref2[_p];
        while (row.length < max_field_count) {
          row.push('');
        }
      }
    }
    return this._finalize((function(_this) {
      return function() {
        return callback(null, _this._stats);
      };
    })(this));
  };

  CSV.prototype._finalize = function(callback) {
    var blank, c, col, cols, csv, dup_col, dup_cols, dups, empty, empty_cols, empty_rows, generated, i, j, ops, row, row_index, rows, str, val, vals, _base, _base1, _base2, _base3, _base4, _i, _j, _k, _l, _len, _len1, _len10, _len11, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _s, _t;
    empty_rows = [];
    _ref = this._rows;
    for (row_index = _i = 0, _len = _ref.length; _i < _len; row_index = ++_i) {
      row = _ref[row_index];
      blank = true;
      for (i = _j = 0, _len1 = row.length; _j < _len1; i = ++_j) {
        val = row[i];
        if (val == null) {
          val = '';
        }
        if (this.settings.trim === true) {
          val = val.trim();
        }
        row[i] = val;
        if (val.length > 0) {
          blank = false;
        }
      }
      if (blank === true) {
        empty_rows.push(row_index);
      }
      while (row.length < this._columns.length) {
        row.push('');
      }
    }
    if (this.settings.drop_empty_rows === true) {
      _ref1 = empty_rows.reverse();
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        i = _ref1[_k];
        this._stats.dropped_row_count++;
        remove(i, this._rows);
      }
    }
    dup_cols = [];
    _ref2 = this._stats.duplicate_cols;
    for (col in _ref2) {
      cols = _ref2[col];
      for (_l = 0, _len3 = cols.length; _l < _len3; _l++) {
        c = cols[_l];
        dup_cols.push(c);
      }
      i = this._columns.indexOf(col);
      _ref3 = this._rows;
      for (_m = 0, _len4 = _ref3.length; _m < _len4; _m++) {
        row = _ref3[_m];
        for (_n = 0, _len5 = cols.length; _n < _len5; _n++) {
          dup_col = cols[_n];
          j = this._columns.indexOf(dup_col);
          if (row[j].trim() === '') {
            continue;
          }
          if (row[i].trim() === '' || row[i].trim() === row[j].trim()) {
            row[i] = row[j];
            row[j] = '';
          }
        }
      }
    }
    empty_cols = [];
    _ref4 = this._columns;
    for (_o = 0, _len6 = _ref4.length; _o < _len6; _o++) {
      col = _ref4[_o];
      vals = this.getCol(col);
      empty = true;
      for (_p = 0, _len7 = vals.length; _p < _len7; _p++) {
        val = vals[_p];
        if (val.trim() !== '') {
          empty = false;
          break;
        }
      }
      if (empty) {
        empty_cols.push(col);
      }
    }
    _ref5 = empty_cols.slice().reverse();
    for (_q = 0, _len8 = _ref5.length; _q < _len8; _q++) {
      col = _ref5[_q];
      generated = __indexOf.call(this._blank_cols, col) >= 0 || __indexOf.call(dup_cols, col) >= 0;
      if (!(this.settings.drop_empty_cols === true || generated)) {
        continue;
      }
      if (generated) {
        remove(col, empty_cols, this._blank_cols, dup_cols);
      } else {
        this._stats.dropped_col_count++;
      }
      i = this._columns.indexOf(col);
      remove(i, this._columns);
      remove.apply(null, [i].concat(__slice.call(this._rows)));
    }
    _ref6 = this._stats.duplicate_cols;
    for (col in _ref6) {
      cols = _ref6[col];
      _ref7 = cols.slice().reverse();
      for (_r = 0, _len9 = _ref7.length; _r < _len9; _r++) {
        c = _ref7[_r];
        if (__indexOf.call(dup_cols, c) < 0) {
          remove(c, cols);
        }
      }
      if (cols.length === 0) {
        delete this._stats.duplicate_cols[col];
      }
    }
    this._stats.empty_cols = empty_cols;
    if ((_base = this._stats).col_count == null) {
      _base.col_count = this._columns.length;
    }
    if ((_base1 = this._stats).row_count == null) {
      _base1.row_count = this._rows.length;
    }
    if ((_base2 = this._stats).valid_col_count == null) {
      _base2.valid_col_count = this._columns.length;
    }
    if ((_base3 = this._stats).blank_col_count == null) {
      _base3.blank_col_count = this._blank_cols.length;
    }
    if ((_base4 = this._stats).added_col_count == null) {
      _base4.added_col_count = this._added_cols.length;
    }
    if (this.settings.drop_duplicate_rows === true) {
      rows = [];
      dups = [];
      _ref8 = this._rows;
      for (i = _s = 0, _len10 = _ref8.length; _s < _len10; i = ++_s) {
        row = _ref8[i];
        str = JSON.stringify(row);
        if (__indexOf.call(rows, str) >= 0) {
          dups.push(i);
        } else {
          rows.push(str);
        }
      }
      _ref9 = dups.reverse();
      for (_t = 0, _len11 = _ref9.length; _t < _len11; _t++) {
        i = _ref9[_t];
        this._rows.splice(i, 1);
        this._stats.dropped_row_count++;
        this._stats.row_count--;
      }
    }
    if (callback == null) {
      return;
    }
    if (this._stats.bad_row_indexes.length === 0 || this.settings.strict_field_count === true) {
      return callback();
    }
    ops = clone(this.settings);
    ops.drop_bad_rows = false;
    ops.strict_field_count = true;
    csv = new CSV(ops);
    return csv.parse(this._data, (function(_this) {
      return function(err, stats) {
        if ((err != null) || stats.bad_row_indexes.length > 0 || stats.dropped_row_count > 0) {
          return callback();
        }
        _this._load(csv);
        return callback();
      };
    })(this));
  };

  CSV.prototype._load = function(csv) {
    this._columns = csv._columns;
    this._rows = csv._rows;
    return this._stats = csv._stats;
  };

  CSV.prototype._err = function(msg, code) {
    var e;
    if (code == null) {
      code = 'PARSE';
    }
    this._finalize();
    e = new Error(msg);
    e.code = code;
    return e;
  };

  return CSV;

})();

module.exports = CSV;

clone = function(v) {
  return JSON.parse(JSON.stringify(v));
};

isArray = function(v) {
  if (v == null) {
    return false;
  }
  return typeof v === 'object' && v.constructor === Array;
};

isObject = function(v) {
  if (v == null) {
    return false;
  }
  return typeof v === 'object' && v.constructor === Object;
};

remove = function() {
  var arr, arrays, i, v, _i, _len, _results;
  v = arguments[0], arrays = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  _results = [];
  for (_i = 0, _len = arrays.length; _i < _len; _i++) {
    arr = arrays[_i];
    i = typeof v === 'number' ? v : arr.indexOf(v);
    if (i > -1) {
      _results.push(arr.splice(i, 1));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

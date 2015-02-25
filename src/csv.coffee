module.exports = class CSV

	constructor: (@settings={}) ->
		@_init()
		@settings.trim ?= true
		@settings.drop_bad_rows ?= false
		@settings.drop_empty_cols ?= false
		@settings.allow_single_col ?= false
		@settings.default_col_name ?= 'Unknown'

	_init: ->
		@_columns = []
		@_rows = []
		@_stats =
			line_ending: 'unknown'
			delimiter: 'unknown'
			col_count: null
			row_count: null
			empty_cols: []
			duplicate_cols: {}
			bad_row_indexes: []
			valid_col_count: null
			blank_col_count: null
			added_col_count: null
			dropped_col_count: 0
			dropped_row_count: 0
		@_blank_cols = []
		@_added_cols = []

	getStats: -> @_stats
	getColCount: -> @_columns.length
	getRowCount: -> @_rows.length

	getCols: -> @_columns
	getCol: (i) ->
		return null unless typeof i in ['number', 'string']
		if typeof i is 'string'
			i = @_columns.indexOf(i)
			return null unless i > -1
		i = @getColCount() + i if i < 0
		col = []
		col.push row[i] for row in @_rows
		return col

	getRows: -> @_rows
	getRow: (i) ->
		return null unless typeof i is 'number'
		i = @getRowCount() + i if i < 0
		return null unless @_rows[i]?
		return @_rows[i]

	getObjects: -> (@getObject(i) for i in [0...@getRowCount()])
	getObject: (i) ->
		row = @getRow(i)
		return null unless row?
		ob = {}
		for column, j in @_columns
			ob[column] = row[j] if row[j]?
		return ob

	toString: ->
		return '' unless @_columns.length > 0
		data = '"' + @_columns.join('","') + '"'
		for row in @_rows
			line = '\n"'
			for val in row
				line += val.replace(/\n/g, '\r').replace(/"/g, '""') + '","'
			data += line.slice(0, -2)
		return data

	writeToStream: (stream, callback) ->
		stream.write @toString(), ->
			stream.end null, ->
				callback?()

	writeToRes: (res, filename='data.csv', callback) ->
		if typeof res.set is 'function'
			headers =
				'Content-Type': 'text/csv'
				'Content-Disposition': "attachment;filename=#{filename}"
			res.set(headers)
		@writeToStream(res, callback)

	readFile: (path, callback) ->
		data = ''
		stream = require('fs').createReadStream(path)
			.on 'data', (chunk) ->
				data += chunk
			.on 'error', (err) =>
				callback?(@_err('Unable to read ' + path, 'READ'))
			.on 'end', =>
				@parse data, (err, stats) ->
					callback?(err, stats)

	writeToFile: (path, callback) ->
		require('fs').writeFile path, @toString(), (err) =>
			return callback?(@_err('Unable to write ' + path, 'WRITE')) if err?
			callback?()

	readObjects: (data, callback) ->
		return callback(@_err('Input was not an array of objects', 'INPUT')) unless @_isArray(data) and data.length > 0
		return callback(@_err("Input at index #{i} was not an object", 'INPUT')) for ob, i in data when not @_isObject(ob)
		@_init()

		# column index finder
		bestIndex = (cols, col) =>
			return 0 if @_columns.length is 0
			if col.length > 2
				for len in [(col.length - 2)..2]
					regex = new RegExp('^' + col.substr(0, len))
					for col, i in @_columns.slice().reverse()
						return -i if col.match(regex)?
			for col, i in cols.slice().reverse()
				return -i unless col in @_columns

		# build columns
		@_columns = Object.keys(data[0])
		for ob in data
			keys = Object.keys(ob)
			for col in keys
				continue if col in @_columns
				@_columns.splice(bestIndex(keys, col), 0, col)

		# build rows
		for ob in data
			row = []
			for key, val of ob
				new_val = ''
				if @_isObject(val) or @_isArray(val) then new_val = JSON.stringify(val)
				else if typeof val.toString is 'function' then new_val = val.toString()
				row[@_columns.indexOf(key)] = new_val
			@_rows.push row

		# finalize
		@_finalize()
		@_stats.line_ending = 'n/a'
		@_stats.delimiter = 'n/a'
		callback(null, @_stats)

	parse: (data, callback) ->
		return callback(@_err('Input was not a string', 'INPUT')) unless typeof data is 'string'
		@_init()

		# column name generator
		getNextColumnName = (name=@settings.default_col_name) =>
			i = if name in @_columns then 2 else 1
			loop
				col_name = "#{name} #{i++}"
				return col_name unless col_name in @_columns

		# detect line ending
		data = data.trim()
		min_index = null
		for name, ending of {'CRLF': '\r\n', 'LF': '\n', 'CR': '\r'}
			i = data.indexOf(ending)
			if i > 0 and (not min_index? or i < min_index)
				min_index = i
				line_ending = ending
				@_stats.line_ending = name
		newline_flag = '{{{magic-csv}}}'
		data = data.replace(/\r\n/g, newline_flag) unless line_ending is '\r\n'
		data = data.split(line_ending)
		return callback(@_err('Line ending detection failed', 'PARSE')) unless data.length > 1
		cols = data.shift()

		# detect delimiter
		char_counts = {}
		delimiter_types = {',': 'comma', '|': 'pipe', '\t': 'tab'}
		for char, name of delimiter_types
			char_counts[name] = cols.split(char).length - 1
		delimiter = '\t'
		delimiter = ',' if char_counts.comma > char_counts.tab
		delimiter = '|' if char_counts.comma < char_counts.pipe > char_counts.tab
		col_delimiter = if cols.trim().substr(0, 1) is '"' then '"' + delimiter + '"' else delimiter
		cols = cols.split(col_delimiter)
		return callback(@_err('Delimiter detection failed', 'PARSE')) unless cols.length > 1 or @settings.allow_single_col is true
		@_stats.delimiter = if cols.length is 1 then 'n/a' else delimiter_types[delimiter]
		@_columns = cols

		# detect columns
		cols_found = []
		dup_cols = {}
		for col, i in cols
			col = col.trim().replace(/^"|"$/g, '').trim()
			if col is ''
				cols[i] = getNextColumnName()
				@_blank_cols.push cols[i]
			else
				if col in cols_found
					new_col = getNextColumnName(col)
					dup_cols[col] ?= []
					dup_cols[col].push new_col
					col = new_col
				cols[i] = col
				cols_found.push col
		@_stats.valid_col_count = cols_found.length
		@_stats.duplicate_cols = dup_cols
		if @_blank_cols.length / cols.length >= .5 and @settings.allow_single_col isnt true
			return callback(@_err('Column name detection failed', 'PARSE'))

		# parse rows
		bad_rows = []
		min_field_count = null
		max_field_count = 0
		for line, line_index in data

			# parse row
			continue if line.trim() is ''
			row = line.split(delimiter)
			starts = []
			ends = []
			seek = false
			for val, i in row
				start = false
				end = false
				val = val
					.replace(/\r/g, '\n')
					.replace(new RegExp(newline_flag, 'g'), '\n')
				v = val.trim()
				if not seek and (v.match(/^"/)? and not v.match(/^""[^"]/)?) and (not v.match(/"$/)? or v.match(/[^"]""$/)?) and not v.match(/[^"]{1}"[^"]{1}/)?
					start = true
					seek = true
					starts.push i
				if seek and (v.match(/"$/)? and not v.match(/[^"]""$/)?) and (not v.match(/^"/)? or v.match(/^""[^"]/)?)
					end = true
					seek = false
					ends.push i
				if v in ['"', '"""']
					if seek
						ends.push i
					else starts.push i
					seek = not seek
				quoted = v.match(/^"/)? and v.match(/"$/)?
				val = val.replace(/^[\n]*"/, '') if start or quoted
				val = val.replace(/"[\n]*$/, '') if end or quoted
				row[i] = val

			# find terminator
			if seek
				if row.length - cols.length is 1 and row[row.length - 1] is ''
					starts.pop()
				else if row.length isnt cols.length
					data[line_index + 1] = line + newline_flag + data[line_index + 1] if data[line_index + 1]?
					continue

			# join quoted fields
			if starts.length > 0 and ends.length > 0
				new_row = []
				index = 0
				for start_index, i in starts
					end_index = ends[i]
					new_row.push row[j] for j in [index...start_index]
					index = end_index + 1
					new_row.push row.slice(start_index, end_index + 1).join(delimiter)
				for i in [index...row.length]
					new_row.push row[i] if row[i]?
				row = new_row
			row[i] = val.replace(/""/g, '"') for val, i in row
			row.pop() while row.length > cols.length and row[row.length - 1] is ''

			# handle bad row
			allow_row = true
			if row.length > cols.length or row.length < cols.length - 2
				bad_rows.push row
				@_stats.bad_row_indexes.push line_index
				if @settings.drop_bad_rows is true
					allow_row = false
					@_stats.dropped_row_count++

			# add row
			if allow_row
				@_rows.push row
				min_field_count = row.length if not max_field_count? or row.length < min_field_count
				max_field_count = row.length if row.length > max_field_count

		# handle bad rows
		while max_field_count > cols.length
			col = getNextColumnName()
			@_added_cols.push col
			cols.push col
		return callback(@_err('Column shifting detected', 'PARSE')) if @_added_cols.length / cols.length >= .5
		if bad_rows.length > 0 and @_rows.length is 0
			@_stats.dropped_row_count = 0
			@_stats.bad_row_indexes.length = 0
			@_rows = bad_rows if @settings.drop_bad_rows is true
		if @settings.drop_bad_rows isnt true and max_field_count > min_field_count
			for row in @_rows
				row.push '' while row.length < max_field_count

		# finalize
		@_finalize()
		callback(null, @_stats)

	_isArray: (v) -> typeof v is 'object' and v.constructor is Array
	_isObject: (v) -> typeof v is 'object' and v.constructor is Object
	_remove: (v, arrays...) ->
		for arr in arrays
			i = if typeof v is 'number' then v else arr.indexOf(v)
			arr.splice(i, 1) if i > -1

	_err: (msg, code) ->
		@_finalize()
		e = new Error(msg)
		e.code = code if code?
		return e

	_finalize: ->

		# standardize rows
		for row in @_rows
			for val, i in row
				val ?= ''
				val = val.trim() if @settings.trim is true
				row[i] = val
			row.push '' while row.length < @_columns.length

		# reconcile duplicate columns
		dup_cols = []
		for col, cols of @_stats.duplicate_cols
			dup_cols.push c for c in cols
			i = @_columns.indexOf(col)
			for row in @_rows
				for dup_col in cols
					j = @_columns.indexOf(dup_col)
					continue if row[j].trim() is ''
					if row[i].trim() is '' or row[i].trim() is row[j].trim()
						row[i] = row[j]
						row[j] = ''

		# find empty columns
		empty_cols = []
		for col in @_columns
			vals = @getCol(col)
			empty = true
			for val in vals
				if val.trim() isnt ''
					empty = false
					break
			empty_cols.push col if empty

		# drop empty columns
		for col in empty_cols.slice().reverse()
			generated = col in @_blank_cols or col in dup_cols
			continue unless @settings.drop_empty_cols is true or generated
			if generated
				@_remove(col, empty_cols, @_blank_cols, dup_cols)
			else @_stats.dropped_col_count++
			i = @_columns.indexOf(col)
			@_remove(i, @_columns)
			@_remove(i, @_rows...)

		# finalize duplicate columns stat
		for col, cols of @_stats.duplicate_cols
			for c in cols.slice().reverse()
				@_remove(c, cols) unless c in dup_cols
			delete @_stats.duplicate_cols[col] if cols.length is 0

		# stats
		@_stats.empty_cols = empty_cols
		@_stats.col_count ?= @_columns.length
		@_stats.row_count ?= @_rows.length
		@_stats.valid_col_count ?= @_columns.length
		@_stats.blank_col_count ?= @_blank_cols.length
		@_stats.added_col_count ?= @_added_cols.length
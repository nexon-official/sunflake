package plugin

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

type appendFunc func(slice interface{}, v interface{}) (newSlice interface{}, err error)

type table struct {
	cols []column
}

type column struct {
	columnType *sql.ColumnType
	appendf    appendFunc
	values     interface{}
}

func newTableFromRows(rows *sql.Rows) (*table, error) {
	types, err := rows.ColumnTypes()
	if err != nil {
		return nil, fmt.Errorf("failed to build the dataframe, caused by an error from rows.ColumnTypes(): %v", err)
	}

	// TODO: check if a column size is 0.
	// for i, columnType := range types {
	// 	log.DefaultLogger.Info(fmt.Sprintf("%d) columyType: %s [%v]", i+1, columnType.Name(), columnType.ScanType()))
	// }

	colCount := len(types)
	scanValues := make([]any, colCount)
	for i := range scanValues {
		scanValues[i] = new(any)
	}

	table, err := newTable(types)
	if err != nil {
		return nil, fmt.Errorf("failed to build the dataframe, cause by an error from newTable(): %v", err)
	}

	rowCount := 0
	for rows.Next() {
		// TODO: check if rowCount exceeds the limit
		err := rows.Scan(scanValues...)
		if err != nil {
			return nil, fmt.Errorf("failed to build the dataframe, caused by an error from rows.Scan(): %v", err)
		}

		for i, scanValue := range scanValues {
			v := *(scanValue.(anyp))
			err := table.append(i, v)
			if err != nil {
				return nil, fmt.Errorf("failed to build the dataframe, cause by an error from table.append(): %v", err)
			}
		}
		rowCount++
	}

	// log.DefaultLogger.Info(fmt.Sprintf("rowCount: %d", rowCount))

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to scan rows: %v", err)
	}

	return table, nil
}

func newTable(types []*sql.ColumnType) (*table, error) {
	cols, err := initColumns(types)
	if err != nil {
		return nil, fmt.Errorf("failed to create a table: %v", err)
	}

	return &table{cols}, nil
}

func initColumns(types []*sql.ColumnType) ([]column, error) {
	cols := make([]column, len(types))

	for i, t := range types {
		appendf, err := getAppender(t)
		if err != nil {
			return nil, fmt.Errorf("failed to init columns: %v", err)
		}

		columnValues, err := newColumnVaules(t)
		if err != nil {
			return nil, fmt.Errorf("failed to init columns: %v", err)
		}

		cols[i] = column{
			t,
			appendf,
			columnValues,
		}
	}

	return cols, nil
}

func (t *table) append(columnIndex int, columnValue interface{}) error {
	values := t.cols[columnIndex].values
	values, err := t.cols[columnIndex].appendf(values, columnValue)
	if err != nil {
		return err
	}

	t.cols[columnIndex].values = values
	return nil
}

func (t *table) convertToFrame(name string) (frame *data.Frame, err error) {
	frame = data.NewFrame(name)

	for _, c := range t.cols {
		// TODO: add label
		frame.Fields = append(frame.Fields, data.NewField(c.columnType.Name(), nil, c.values))
	}

	return frame, nil
}

func newColumnVaules(t *sql.ColumnType) (interface{}, error) {
	switch t.ScanType().String() {
	case "string":
		return make([]*string, 0), nil
	case "int64":
		return make([]*int64, 0), nil
	case "float64":
		return make([]*float64, 0), nil
	case "time.Time":
		return make([]time.Time, 0), nil
	case "bool":
		return make([]*bool, 0), nil
	}

	return nil, fmt.Errorf("failed to create column values, cause by not supported type [%v]", t.ScanType())
}

var appenderMap = map[string]appendFunc{
	"string":    appendStringToString,
	"int64":     appendStringToInt64,
	"float64":   appendValueToFloat64,
	"time.Time": appendTimeToTime,
	"bool":      appendBoolToBool,
}

func appendStringToString(slice interface{}, v interface{}) (interface{}, error) {
	s, ok := slice.([]*string)
	if !ok {
		return nil, fmt.Errorf("failed to convert slice to []string")
	}

	if v == nil {
		s = append(s, nil)
	} else {
		e, ok := v.(string)
		if !ok {
			return nil, fmt.Errorf("failed to convert %T[%v] to the string type", v, v)
		}
		s = append(s, &e)
	}

	return s, nil
}

func appendStringToInt64(slice interface{}, v interface{}) (interface{}, error) {
	e, ok := v.(string)
	if !ok {
		return nil, fmt.Errorf("failed to convert %T[%v] to the int64 type", v, v)
	}

	s, ok := slice.([]*int64)
	if !ok {
		return nil, fmt.Errorf("failed to convert slice to []int64")
	}

	n, err := strconv.ParseInt(e, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse %T[%v] to int64", v, v)
	}

	s = append(s, &n)
	return s, nil
}

func appendFloat64ToFloat64(slice interface{}, v interface{}) (interface{}, error) {
	e, ok := v.(float64)
	if !ok {
		return nil, fmt.Errorf("failed to convert %T[%v] to the float64 type", v, v)
	}

	s, ok := slice.([]*float64)
	if !ok {
		return nil, fmt.Errorf("failed to convert slice to []float64, slice is [%T]type", slice)
	}

	s = append(s, &e)
	return s, nil
}

func appendStringToFloat64(slice interface{}, v interface{}) (interface{}, error) {
	e, ok := v.(string)
	if !ok {
		return nil, fmt.Errorf("failed to convert %T[%v] to the float64 type", v, v)
	}

	s, ok := slice.([]*float64)
	if !ok {
		return nil, fmt.Errorf("failed to convert slice to []float64, slice is [%T]type", slice)
	}

	n, err := strconv.ParseFloat(e, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse %T[%v] to float64", v, v)
	}

	s = append(s, &n)
	return s, nil
}

func appendValueToFloat64(slice interface{}, v interface{}) (interface{}, error) {
	switch t := v.(type) {
	case string:
		return appendStringToFloat64(slice, v)
	case float64:
		return appendFloat64ToFloat64(slice, v)
	default:
		return nil, fmt.Errorf("failed to convert %v[%v] to the float64 type", t, v)
	}
}

func appendTimeToTime(slice interface{}, v interface{}) (interface{}, error) {
	e, ok := v.(time.Time)
	if !ok {
		return nil, fmt.Errorf("failed to convert %T[%v] to the time.Time", v, v)
	}

	s, ok := slice.([]time.Time)
	if !ok {
		return nil, fmt.Errorf("failed to convert slice to []time.Time")
	}

	s = append(s, e)
	return s, nil
}

// func appendStringToBool(slice interface{}, v interface{}) (interface{}, error) {
// 	e, ok := v.(string)
// 	if !ok {
// 		return nil, fmt.Errorf("failed to convert %T[%v] to the bool type", v, v)
// 	}

// 	s, ok := slice.([]bool)
// 	if !ok {
// 		return nil, fmt.Errorf("failed to convert slice to []bool")
// 	}

// 	n, err := strconv.ParseBool(e)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to parse %T[%v] to bool", v, v)
// 	}

// 	s = append(s, n)
// 	return s, nil
// }

func appendBoolToBool(slice interface{}, v interface{}) (interface{}, error) {
	e, ok := v.(bool)
	if !ok {
		return nil, fmt.Errorf("failed to convert %T[%v] to the bool type", v, v)
	}

	s, ok := slice.([]*bool)
	if !ok {
		return nil, fmt.Errorf("failed to convert slice to []bool")
	}

	s = append(s, &e)
	return s, nil
}

func getAppender(t *sql.ColumnType) (appendFunc, error) {
	st := t.ScanType().String()

	if appendf, found := appenderMap[st]; found {
		return appendf, nil
	}

	return nil, fmt.Errorf("failed to get the appender for [%s] type", st)
}

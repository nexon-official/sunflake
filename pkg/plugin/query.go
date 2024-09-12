package plugin

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/gtime"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/nexon/sunflake/pkg/util/er"
)

type queryJson struct {
	QueryText  string
	DataFormat string
}

type queryModel struct {
	raw               string
	from              time.Time
	to                time.Time
	interval          time.Duration
	sql               string
	isTimeseries      bool
	shouldFillMissing bool
	fillMissingOption *data.FillMissing
}

type any = interface{}
type anyp = *any

var matchMacro, _ = regexp.Compile(`\$([_a-zA-Z0-9]+)\(([^\)]*)\)`)

func buildQueryModel(query *backend.DataQuery) (*queryModel, error) {
	var qj queryJson

	// Unmarshal the JSON into our queryJson.
	if err := json.Unmarshal(query.JSON, &qj); err != nil {
		return nil, fmt.Errorf("failed to unmarshal the query.JSON to queryJson: [%v]", err)
	}

	var isTimeseries bool = qj.DataFormat == "timeseries" || qj.DataFormat == ""

	qm := queryModel{
		raw:               qj.QueryText,
		from:              query.TimeRange.From,
		to:                query.TimeRange.To,
		interval:          query.Interval,
		isTimeseries:      isTimeseries,
		shouldFillMissing: false,
		fillMissingOption: &data.FillMissing{
			Mode: data.FillModeNull,
		},
	}

	if err := qm.evalAllMacros(); err != nil {
		return nil, fmt.Errorf("failed to evaluate the macro: [%v]", err)
	}

	return &qm, nil
}

func (qm *queryModel) evalAllMacros() error {
	matches := matchMacro.FindAllStringSubmatchIndex(qm.raw, -1)
	var sb strings.Builder
	var currIndex = 0

	for _, match := range matches {
		sb.WriteString(qm.raw[currIndex:match[0]])

		var subMatches [3]string
		for j := 0; j < 3; j++ {
			subMatch := qm.raw[match[j*2]:match[j*2+1]]
			subMatches[j] = subMatch
		}

		sql, err := qm.evalMacro(subMatches)
		if err != nil {
			return fmt.Errorf("failed to evaluate macros: [%v]", err)
		}

		sb.WriteString(sql)

		currIndex = match[1]
	}

	sb.WriteString(qm.raw[currIndex:])
	qm.sql = sb.String()

	return nil
}

func (qm *queryModel) evalMacro(matches [3]string) (sql string, err error) {
	name := matches[1]
	args := splitArgs(matches[2])

	switch name {
	case "__time":
		if len(args) == 0 {
			return "", fmt.Errorf("failed to evaluate the macro [%s], cause by missing time column argument", name)
		}
		sql = toTimestamp(args[0])
	case "__timeFrom":
		sql = toRFC3339(qm.from)
	case "__timeTo":
		sql = toRFC3339(qm.to)
	case "__timeFilter":
		sql = timeFilter(args[0], qm.from, qm.to)
	case "__timeGroup":
		if err := qm.setTimeGroup(args); err != nil {
			return "", fmt.Errorf("failed to evaluate the macro [%s]: [%v]", name, err)
		}
		sql = timeGroup(args[0], qm.interval)
	default:
		return "", fmt.Errorf("failed to generate a SQL: unsupported macro [%s]", name)
	}

	return sql, nil
}

func (qm *queryModel) setTimeGroup(args []string) error {
	argsCount := len(args)

	if argsCount < 2 {
		return fmt.Errorf("failed to set the timeGroup: macro __timeGroup needs time column")
	}

	it, err := gtime.ParseInterval(strings.Trim(args[1], `'"`))
	if err != nil {
		return fmt.Errorf("failed to set the timeGroup, cause by an error from parseInterval(%s)", args[1])
	}

	if it.Seconds() <= 0 {
		return fmt.Errorf("failed to set the timeGroup: interval[%s] must be at least in seconds", args[1])
	}

	qm.interval = it

	if argsCount >= 3 {
		// TODO: duplicated timeGroup
		if qm.shouldFillMissing {
			return fmt.Errorf("failed to set the timeGroup, cause by duplicated")
		}
		qm.shouldFillMissing = true

		switch strings.ToLower(args[2]) {
		case "null":
			qm.fillMissingOption.Mode = data.FillModeNull
		case "previous":
			qm.fillMissingOption.Mode = data.FillModePrevious
		default:
			v, err := strconv.ParseFloat(args[2], 64)
			if err != nil {
				return fmt.Errorf("failed to set the timeGroup, cause by an error from parseFloat[%s]", args[2])
			}
			qm.fillMissingOption.Mode = data.FillModeValue
			qm.fillMissingOption.Value = v
		}
	}

	return nil
}

func splitArgs(args string) []string {
	as := strings.Split(args, ",")

	for i, a := range as {
		as[i] = strings.TrimSpace(a)
	}

	return as
}

func (qm *queryModel) execute(ctx context.Context, db *sql.DB) (*table, error) {
	rows, err := db.QueryContext(ctx, qm.sql)
	if err != nil {
		return nil, fmt.Errorf("failed to query [%s]: [%v]", qm.sql, err)
	}
	defer rows.Close()

	table, err := newTableFromRows(rows)
	if err != nil {
		return nil, fmt.Errorf("failed to build a table from rows: %v", err)
	}

	return table, nil
}

func (qm *queryModel) convertToFrame(table *table) (*data.Frame, error) {
	frame, err := table.convertToFrame("response")
	if err != nil {
		return nil, fmt.Errorf("failed to table to frame: %v", err)
	}

	if l, _ := frame.RowLen(); l <= 0 {
		return frame, nil
	}

	if qm.isTimeseries {
		schema := frame.TimeSeriesSchema()
		if schema.Type == data.TimeSeriesTypeNot {
			return frame, nil
		}

		if schema.Type == data.TimeSeriesTypeLong {
			frame, err = data.LongToWide(frame, qm.fillMissingOption)
			if err != nil {
				newerr := fmt.Errorf("failed to convert table to frame, cause by an error from LongToWide: %v", err)
				if strings.Contains(err.Error(), "sorted ascending by time") {
					return frame, er.NewError(er.ErrMustBeSortedByTime, newerr)
				} else {
					return frame, newerr
				}
			}
		}

		if qm.shouldFillMissing {
			frame, err = qm.fillMissingPoints(&schema, frame)
			if err != nil {
				return frame, fmt.Errorf("failed to convert table to frame, cause by an error from fillMissingPoints: %v", err)
			}
		}
	}

	return frame, err
}

func (qm *queryModel) fillMissingPoints(schema *data.TimeSeriesSchema, frame *data.Frame) (*data.Frame, error) {
	timeIdx := schema.TimeIndex
	timeField := frame.Fields[timeIdx]
	switch t := timeField.At(0).(type) {
	case time.Time:
		return qm.fillMissingPointsForClass(schema, frame)
	case *time.Time:
		return qm.fillMissingPointsForPointer(schema, frame)
	default:
		return nil, fmt.Errorf("failed to fill missing points, cause by not supported type[%v]", t)
	}
}

func (qm *queryModel) fillMissingPointsForClass(schema *data.TimeSeriesSchema, frame *data.Frame) (*data.Frame, error) {
	newFrame := frame.EmptyCopy()

	timeIdx := schema.TimeIndex
	timeField := frame.Fields[timeIdx]
	rowIdx := 0
	rowTime := timeField.At(rowIdx).(time.Time)
	lastRowIdx := timeField.Len() - 1
	missingVals := buildMissingValues(frame, timeIdx, qm.fillMissingOption)
	missingMode := qm.fillMissingOption.Mode
	prevRowIdx := -1

	for curr := toTimeGroup(qm.from, qm.interval); !curr.After(qm.to); curr = curr.Add(qm.interval) {
		comp := curr.Compare(rowTime)

		if comp == 0 {
			newFrame.AppendRow(frame.RowCopy(rowIdx)...)

			if rowIdx < lastRowIdx {
				rowIdx++
				rowTime = timeField.At(rowIdx).(time.Time)
			}
		} else {
			rowVals := newRow(missingMode, newFrame, prevRowIdx, missingVals)
			rowVals[timeIdx] = curr
			newFrame.AppendRow(rowVals...)
		}

		prevRowIdx++
	}

	return newFrame, nil
}

func (qm *queryModel) fillMissingPointsForPointer(schema *data.TimeSeriesSchema, frame *data.Frame) (*data.Frame, error) {
	newFrame := frame.EmptyCopy()

	timeIdx := schema.TimeIndex
	timeField := frame.Fields[timeIdx]
	rowIdx := 0
	rowTime := timeField.At(rowIdx).(*time.Time)
	lastRowIdx := timeField.Len() - 1
	missingVals := buildMissingValues(frame, timeIdx, qm.fillMissingOption)
	missingMode := qm.fillMissingOption.Mode
	prevRowIdx := -1

	for curr := toTimeGroup(qm.from, qm.interval); !curr.After(qm.to); curr = curr.Add(qm.interval) {
		comp := curr.Compare(*rowTime)

		if comp == 0 {
			newFrame.AppendRow(frame.RowCopy(rowIdx)...)

			if rowIdx < lastRowIdx {
				rowIdx++
				rowTime = timeField.At(rowIdx).(*time.Time)
			}
		} else {
			rowVals := newRow(missingMode, newFrame, prevRowIdx, missingVals)
			rowVals[timeIdx] = &curr
			newFrame.AppendRow(rowVals...)
		}

		prevRowIdx++
	}

	return newFrame, nil
}

func toTimeGroup(t time.Time, it time.Duration) time.Time {
	sec := int64(it.Seconds())
	return time.Unix(t.Unix()/sec*sec, 0)
}

func buildMissingValues(frame *data.Frame, timeIdx int, fillMissing *data.FillMissing) []interface{} {
	vals := make([]interface{}, len(frame.Fields))

	for i, field := range frame.Fields {
		if i == timeIdx {
			continue
		}

		if fillMissing.Mode == data.FillModeValue {
			v, err := data.GetMissing(fillMissing, field, 0)
			if err != nil {
				panic(fmt.Sprintf("an error occured while calling data.GetMissing: [%v]", err))
			}
			vals[i] = v
		} else {
			vals[i] = nil
		}
	}

	return vals
}

func newRow(fillMode data.FillMode, frame *data.Frame, prevRowIdx int, missingVals []interface{}) []interface{} {
	if fillMode == data.FillModePrevious {
		if prevRowIdx >= 0 {
			return frame.RowCopy(prevRowIdx)
		}
	}

	return missingVals
}

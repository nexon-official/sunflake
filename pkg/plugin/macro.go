package plugin

import (
	"fmt"
	"time"
)

// Interpolate provides global macros/substitutions for all sql datasources.
// var Interpolate = func(query backend.DataQuery, timeRange backend.TimeRange, timeInterval string, sql string) string {
// 	interval := query.Interval

// 	sql = strings.ReplaceAll(sql, "$__interval_ms", strconv.FormatInt(interval.Milliseconds(), 10))
// 	sql = strings.ReplaceAll(sql, "$__interval", gtime.FormatInterval(interval))
// 	sql = strings.ReplaceAll(sql, "$__unixEpochFrom()", fmt.Sprintf("%d", timeRange.From.UTC().Unix()))
// 	sql = strings.ReplaceAll(sql, "$__unixEpochTo()", fmt.Sprintf("%d", timeRange.To.UTC().Unix()))

//		return sql
//	}

func toTimestamp(col string) string {
	return fmt.Sprintf("TO_TIMESTAMP_NTZ(%s) AS time", col)
}

func toRFC3339(t time.Time) string {
	return fmt.Sprintf("'%s'", t.UTC().Format(time.RFC3339Nano))
}

func timeFilter(col string, from time.Time, to time.Time) string {
	return fmt.Sprintf("%s BETWEEN %s AND %s", col, toRFC3339(from), toRFC3339(to))
}

func timeGroup(col string, it time.Duration) string {
	return fmt.Sprintf("TIME_SLICE(TO_TIMESTAMP_NTZ(%s), %v, 'SECOND', 'START')", col, it.Seconds())
}

// func toTimeEpoch(col string) string {
// 	// return fmt.Sprintf("DATE_PART(EPOCH_SECOND, %s) AS time_sec", arg)
// 	return fmt.Sprintf("extract(epoch from %s) AS time", col)
// }

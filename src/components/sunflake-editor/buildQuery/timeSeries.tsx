import { DEFAULT_METRIC_COLUMN, MetricColumn, SnowflakeObject, TableColumn, TimeSeries } from "types"

export function buildSqlForTimeSeries(snowflakeObject: SnowflakeObject, timeSeries: TimeSeries): string {
  const { timeColumn, interval, timeUnit, fillMissing, rowLimit,
    filterString = '',
    lineIdentifiers = [],
    metrics = [DEFAULT_METRIC_COLUMN],
  } = timeSeries

  // try {
  const timeGroup = toTimeGroup(timeColumn, interval, timeUnit, fillMissing)
  const timeFilter = toTimeFilter(timeColumn)
  const lineIds = toLineIds(lineIdentifiers)

  return (
    toSelectStmt(timeGroup, lineIds, metrics)
    + toFromStmt(snowflakeObject)
    + toWhereStmt(timeFilter, filterString)
    + toGroupByStmt(lineIds)
    + toOrderByStmt(rowLimit)
  )
  // } catch (error: any) {
  //   if (error instanceof Error) {
  //     console.log('error! =>', error.message)
  //     return error.message
  //   }
  //   console.log('Unknown error! =>', error)
  //   return 'Unknown error'
  // }
}

function toTimeGroup(timeColumn?: TableColumn, interval?: number, timeUnit?: string, fillMissing?: string) {
  if (!timeColumn) {
    throw new Error('timeColumn is undefined')
  }

  return `$__timeGroup(${timeColumn.name}, '${interval}${timeUnit}', ${fillMissing})`
}

function toTimeFilter(timeColumn?: TableColumn) {
  if (!timeColumn) {
    throw new Error('timeColumn is undefined')
  }

  return `$__timeFilter(${timeColumn.name})`
}

function toLineIds(lineIdentifiers: string[]) {
  const lineIds = lineIdentifiers
    .filter((line) => line ? true : false)
    .join(', ')

  return lineIds ? ', ' + lineIds : ''
}

function toSelectStmt(timeGroup: string, lineIds: string, metrics: MetricColumn[]): string {
  const stmt = metrics
    .filter((col) => (col.column && col.column.name ? true : false))
    .map((col) => (`${col.aggFunc}(${col.column?.name})` + (col.alias ? ` AS "${col.alias}"` : '')))
    .join(', ')

  if (!stmt) {
    throw new Error('metrics is undefined')
  }

  return `SELECT ${timeGroup} AS "time"${lineIds}, ${stmt}`
}

function toFromStmt(snowflakeObject: SnowflakeObject) {
  const stmt = snowflakeObject.table ? [snowflakeObject.database, snowflakeObject.schema, snowflakeObject.table].join('.') : ''
  return stmt ? ` FROM ${stmt}` : ''
}

function toWhereStmt(timeFilter: string, filterString: string) {
  return ` WHERE ${timeFilter}` + (filterString ? ` AND ${filterString}` : '')
}

function toGroupByStmt(lineIds: string) {
  return ` GROUP BY "time"${lineIds}`
}

function toOrderByStmt(rowLimit: number) {
  return ` ORDER BY "time" LIMIT ${rowLimit}`
}

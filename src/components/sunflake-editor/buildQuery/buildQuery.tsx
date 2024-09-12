import { DataFormat, DEFAULT_TIME_SERIES, QueryBuilder, SnowflakeObject, TimeSeries } from "types"
import { buildSqlForQueryBuilder } from "./queryBuilder"
import { buildSqlForTimeSeries } from "./timeSeries"

type SunflakeStateParam = {
  dataFormat?: string
  snowflakeObject?: SnowflakeObject
  timeSeries?: TimeSeries
  queryBuilder?: QueryBuilder
}

export function buildQuery({ dataFormat = DataFormat.TimeSeries, snowflakeObject = {}, timeSeries = DEFAULT_TIME_SERIES, queryBuilder = {} }: SunflakeStateParam): string {
  return (dataFormat === DataFormat.TimeSeries)
    ? buildSqlForTimeSeries(snowflakeObject, timeSeries)
    : buildSqlForQueryBuilder(snowflakeObject, queryBuilder)
}

export function tryBuildQuery(state: SunflakeStateParam, queryOnError: string) {
  try {
    return buildQuery(state)
  } catch (error) {
    return queryOnError
  }
}

import { DataSourceJsonData } from '@grafana/data'
import { DataQuery } from '@grafana/schema'
import { JsonTree } from '@react-awesome-query-builder/core'

export const DataFormat = {
  TimeSeries: "timeseries",
  Table: "table",
}

export const EditorMode = {
  Builder: "builder",
  Code: "code",
}

export interface SunflakeState extends DataQuery {
  queryText: string
  dataFormat?: string
  editorMode?: string
  queryBuilder?: QueryBuilder
  timeSeries?: TimeSeries
  snowflakeObject?: SnowflakeObject
}

export interface QueryBuilder {
  hasFilter?: boolean
  hasGroupBy?: boolean
  hasOrderBy?: boolean
  selectColumns?: SelectColumn[]
  whereJsonTree?: JsonTree
  whereString?: string
  groupByColumns?: string[]
  orderByColumn?: OrderByColumn
}

export interface SnowflakeObject {
  databaseList?: string[]
  database?: string
  schemaList?: string[]
  schema?: string
  tableList?: string[]
  table?: string
  columnList?: TableColumn[]
}

export interface TableColumn {
  name: string
  type: string
}

export interface SelectColumn {
  column?: TableColumn
  alias?: string
  aggFunc?: string
}

export const AggregateFunc = {
  AVG: "AVG",
  COUNT: "COUNT",
  MAX: "MAX",
  MIN: "MIN",
  SUM: "SUM",
}

export type SortOrder = 'ASC' | 'DESC'

export interface OrderByColumn {
  name?: string
  limit?: number
  sortOrder?: SortOrder
}

export interface TimeSeries {
  timeColumn?: TableColumn
  interval: number
  timeUnit: string
  fillMissing: string
  lineIdentifiers?: string[]
  metrics?: MetricColumn[]
  rowLimit: number
  filterJsonTree?: JsonTree
  filterString?: string
}

// Valid time units are "ns", "us" (or "µs"), "ms", "s", "m", "h".
// Period d, w, M, y
export const TimeUnit = {
  Year: "y",
  Month: "M",
  Week: "w",
  Day: "d",
  Hour: "h",
  Minute: "m",
  Second: "s",
}

export const FillMissing = {
  Zero: '0',
  None: 'null',
  Previous: 'previous',
}

export interface MetricColumn {
  column?: TableColumn
  alias?: string
  aggFunc: string
}

export const MAX_ROW_LIMIT = 1000000
export const DEFAULT_ROW_LIMIT = 1000

export const DEFAULT_TIME_SERIES: TimeSeries = {
  interval: 1,
  timeUnit: TimeUnit.Minute,
  fillMissing: FillMissing.Zero,
  rowLimit: DEFAULT_ROW_LIMIT,
}

export const DEFAULT_STATE: Partial<SunflakeState> = {
  queryText: "",
  dataFormat: DataFormat.TimeSeries,
  editorMode: EditorMode.Builder,
  timeSeries: DEFAULT_TIME_SERIES,
}

export const DEFAULT_COLUMN_LIST: TableColumn[] = [] as TableColumn[]

/**
 * These are options configured for each DataSource instance
 */
export interface SunflakeDataSourceOptions extends DataSourceJsonData {
  account?: string
  authtype?: string
  user?: string
  role?: string
  database?: string
  schema?: string
  warehouse?: string
  connPoolOptions?: ConnectionPoolOptions
}

export interface ConnectionPoolOptions {
  maxOpen: number
  maxIdle: number
  idleTimeout: number
  maxLifetime: number
}

export const DEFAULT_CONNECTION_POOL: ConnectionPoolOptions = {
  maxOpen: 100,
  maxIdle: 2,
  idleTimeout: 180,
  maxLifetime: 3600,
}

export const DEFAULT_METRIC_COLUMN: MetricColumn = {
  aggFunc: AggregateFunc.MAX
}


/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface SunflakeSecureJsonData {
  password: string
  privatekey: string
}

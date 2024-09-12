// import { TableColumn } from "types"

import { JsonTree } from "@react-awesome-query-builder/core"
import { SortOrder, TableColumn } from "types"

type Action =
  | { type: 'SET_DATA_FORMAT', dataFormat: string }
  | { type: 'SET_EDITOR_MODE', editorMode: string }
  | { type: 'SET_QUERY_TEXT', queryText: string }
  // QueryBuilder
  | { type: 'SET_HAS_FILTER', hasFilter: boolean }
  | { type: 'SET_HAS_GROUP_BY', hasGroupBy: boolean }
  | { type: 'SET_HAS_ORDER_BY', hasOrderBy: boolean }
  // SnowflakeObject
  | { type: 'SET_DATABASE_LIST', databaseList: string[] }
  | { type: 'SET_DATABASE', database: string }
  | { type: 'SET_SCHEMA_LIST', schemaList: string[] }
  | { type: 'SET_SCHEMA', schema: string }
  | { type: 'SET_TABLE_LIST', tableList: string[] }
  | { type: 'SET_TABLE', table: string }
  | { type: 'SET_COLUMN_LIST', columnList: TableColumn[] }
  // TimeSeries - Time Axis
  | { type: 'SET_TIME_COLUMN', column: TableColumn }
  | { type: 'SET_TIME_INTERVAL', interval: number }
  | { type: 'SET_TIME_UNIT', timeUnit: string }
  | { type: 'SET_FILL_MISSING', fillMissing: string }
  // TimeSeries - Line Identifier
  | { type: 'ADD_LINE_IDENTIFIER' }
  | { type: 'DELETE_LINE_IDENTIFIER', index: number }
  | { type: 'SET_LINE_IDENTIFIER', name: string, index: number }
  // TimeSeries - Metric
  | { type: 'SET_METRIC_COLUMN', column: TableColumn, index: number }
  | { type: 'SET_METRIC_AGG_FUNC', aggFunc: string, index: number }
  | { type: 'SET_METRIC_ALIAS', alias: string, index: number }
  | { type: 'DELETE_METRIC', index: number }
  | { type: 'ADD_METRIC' }
  // TimeSeries - Filter Columns
  | { type: 'SET_FILTER_COLUMNS', filterJsonTree: JsonTree, filterString: string }
  // TimeSeries - Limit Rows
  | { type: 'SET_LIMIT_ROWS', rowLimit: number }
  // QueryBuilder - Select Clause
  | { type: 'SET_COLUMN_FIELD', column: TableColumn, index: number }
  | { type: 'SET_COLUMN_AGG_FUNC', aggFunc: string, index: number }
  | { type: 'SET_COLUMN_ALIAS', alias: string, index: number }
  | { type: 'DELETE_COLUMN', index: number }
  | { type: 'ADD_COLUMN' }
  // QueryBuilder - Where Clause
  | { type: 'SET_QUERY_WHERE', whereJsonTree: JsonTree, whereString: string }
  // QueryBuilder - GroupBy Clause
  | { type: 'ADD_GROUP_BY' }
  | { type: 'DELETE_GROUP_BY', index: number }
  | { type: 'SET_GROUP_BY', name: string, index: number }
  | { type: 'SET_ORDER_BY_NAME', name: string }
  | { type: 'SET_ORDER_BY_SORT_ORDER', sortOrder: SortOrder }
  | { type: 'SET_ORDER_BY_LIMIT', limit: number }
  // CodeEditor
  | { type: 'SET_QUERY_TEXT', queryText: string }
  | { type: 'RUN_QUERY' }

export type { Action }

export type ActionFn<T> = (t: T) => Action
export const SetDatabaseList: ActionFn<string[]> = (databaseList: string[]) => ({ type: 'SET_DATABASE_LIST', databaseList })
export const SetSchemaList: ActionFn<string[]> = (schemaList: string[]) => ({ type: 'SET_SCHEMA_LIST', schemaList })
export const SetTableList: ActionFn<string[]> = (tableList: string[]) => ({ type: 'SET_TABLE_LIST', tableList })
export const SetColumnList: ActionFn<TableColumn[]> = (columnList: TableColumn[]) => ({ type: 'SET_COLUMN_LIST', columnList })

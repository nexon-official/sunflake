import { DEFAULT_METRIC_COLUMN, DEFAULT_TIME_SERIES, TimeSeries } from "types";
import { Action } from "./action";

export default function timeSeriesReducer(state: TimeSeries = DEFAULT_TIME_SERIES, action?: Action): TimeSeries {
  const { lineIdentifiers = [], metrics = [DEFAULT_METRIC_COLUMN] } = state

  switch (action!.type) {
    case 'SET_DATABASE':
    case 'SET_SCHEMA':
    case 'SET_TABLE':
      return DEFAULT_TIME_SERIES
    case 'SET_TIME_COLUMN':
      return {
        ...state,
        timeColumn: action.column,
      }
    case 'SET_TIME_INTERVAL':
      return {
        ...state,
        interval: action.interval,
      }
    case 'SET_TIME_UNIT':
      return {
        ...state,
        timeUnit: action.timeUnit,
      }
    case 'SET_FILL_MISSING':
      return {
        ...state,
        fillMissing: action.fillMissing,
      }
    case 'ADD_LINE_IDENTIFIER':
      return {
        ...state,
        lineIdentifiers: [...lineIdentifiers, ''],
      }
    case 'DELETE_LINE_IDENTIFIER':
      return {
        ...state,
        lineIdentifiers: [...lineIdentifiers.slice(0, action.index), ...lineIdentifiers.slice(action.index + 1)]
      }
    case 'SET_LINE_IDENTIFIER':
      return {
        ...state,
        lineIdentifiers: lineIdentifiers.map((col, i) => ((i === action.index) ? action.name : col))
      }
    // Metrics
    case 'SET_METRIC_COLUMN':
      return {
        ...state,
        metrics: metrics.map((metric, i) => ((i === action.index) ? { ...metric, column: action.column } : metric))
      }
    case 'SET_METRIC_AGG_FUNC':
      return {
        ...state,
        metrics: metrics.map((metric, i) => (i === action.index) ? { ...metric, aggFunc: action.aggFunc } : metric)
      }
    case 'SET_METRIC_ALIAS':
      return {
        ...state,
        metrics: metrics.map((metric, i) => ((i === action.index) ? { ...metric, alias: action.alias } : metric))
      }
    case 'DELETE_METRIC':
      return {
        ...state,
        metrics: [...metrics.slice(0, action.index), ...metrics.slice(action.index + 1)]
      }
    case 'ADD_METRIC':
      return {
        ...state,
        metrics: [...metrics, DEFAULT_METRIC_COLUMN]
      }
    // Filter Columns
    case 'SET_FILTER_COLUMNS':
      return {
        ...state,
        filterJsonTree: action.filterJsonTree,
        filterString: action.filterString,
      }
    // Limit Rows
    case 'SET_LIMIT_ROWS':
      return {
        ...state,
        rowLimit: action.rowLimit
      }
    default:
      return state
  }
}

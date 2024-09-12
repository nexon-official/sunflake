import { updateKey } from "components/util/dict"
import { QueryBuilder } from "types"
import { Action } from "./action"

type QueryBuilderState = QueryBuilder

export default function queryBuilderReducer(state?: QueryBuilderState, action?: Action) {
  const { selectColumns = [{}], groupByColumns = [] } = state || {}

  switch (action!.type) {
    case 'SET_DATABASE':
    case 'SET_SCHEMA':
    case 'SET_TABLE':
      return {
        ...state,
        selectColumns: [{}],
        whereJsonTree: undefined,
        whereString: undefined
      }
    case 'SET_HAS_FILTER':
      return {
        ...state,
        hasFilter: action.hasFilter,
      }
    case 'SET_HAS_GROUP_BY':
      return {
        ...state,
        hasGroupBy: action.hasGroupBy,
      }
    case 'SET_HAS_ORDER_BY':
      return {
        ...state,
        hasOrderBy: action.hasOrderBy,
      }
    case 'SET_COLUMN_FIELD':
      return {
        ...state,
        selectColumns: selectColumns.map((col, i) => ((i === action.index) ? { ...col, column: action.column } : col))
      }
    case 'SET_COLUMN_AGG_FUNC':
      return {
        ...state,
        selectColumns: selectColumns.map((col, i) => (i === action.index) ? updateKey(col, "aggFunc", action.aggFunc) : col)
      }
    case 'SET_COLUMN_ALIAS':
      return {
        ...state,
        selectColumns: selectColumns.map((col, i) => ((i === action.index) ? { ...col, alias: action.alias } : col))
      }
    case 'DELETE_COLUMN':
      return {
        ...state,
        selectColumns: [...selectColumns.slice(0, action.index), ...selectColumns.slice(action.index + 1)]
      }
    case 'ADD_COLUMN':
      return {
        ...state,
        selectColumns: [...selectColumns, {}]
      }
    case 'SET_QUERY_WHERE':
      return {
        ...state,
        whereJsonTree: action.whereJsonTree,
        whereString: action.whereString,
      }
    case 'ADD_GROUP_BY':
      return {
        ...state,
        groupByColumns: [...groupByColumns, '']
      }
    case 'DELETE_GROUP_BY':
      return {
        ...state,
        groupByColumns: [...groupByColumns.slice(0, action.index), ...groupByColumns.slice(action.index + 1)]
      }
    case 'SET_GROUP_BY':
      return {
        ...state,
        groupByColumns: groupByColumns.map((col, i) => ((i === action.index) ? action.name : col))
      }
    case 'SET_ORDER_BY_NAME':
      return {
        ...state,
        orderByColumn: {
          ...state?.orderByColumn,
          name: action.name,
        }
      }
    case 'SET_ORDER_BY_SORT_ORDER':
      return {
        ...state,
        orderByColumn: {
          ...state?.orderByColumn,
          sortOrder: action.sortOrder,
        }
      }
    case 'SET_ORDER_BY_LIMIT':
      return {
        ...state,
        orderByColumn: {
          ...state?.orderByColumn,
          limit: action.limit,
        }
      }
    default:
      return state
  }
}

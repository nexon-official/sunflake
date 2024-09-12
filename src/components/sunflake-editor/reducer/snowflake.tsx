import { SnowflakeObject } from "types"
import { Action } from "./action"

type SnowflakeState = SnowflakeObject

export default function snowflakeReducer(state: SnowflakeState, action: Action) {
  switch (action.type) {
    case 'SET_DATABASE_LIST':
      return {
        ...state,
        databaseList: action.databaseList
      }
    case 'SET_DATABASE':
      return {
        ...state,
        database: action.database,
        schemaList: [],
        schema: undefined,
        tableList: [],
        table: undefined,
        columnList: [],
      }
    case 'SET_SCHEMA_LIST':
      return {
        ...state,
        schemaList: action.schemaList,
      }
    case 'SET_SCHEMA':
      return {
        ...state,
        schema: action.schema,
        tableList: [],
        table: undefined,
        columnList: [],
      }
    case 'SET_TABLE_LIST':
      return {
        ...state,
        tableList: action.tableList,
      }
    case 'SET_TABLE':
      return {
        ...state,
        table: action.table,
        columnList: [],
      }
    case 'SET_COLUMN_LIST':
      return {
        ...state,
        columnList: action.columnList,
      }
    default:
      return state
  }
}

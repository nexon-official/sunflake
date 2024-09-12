import { SunflakeState } from "types"
import { Action } from "./action"

type TopState = Pick<SunflakeState, "queryText" | "dataFormat" | "editorMode">

export default function topReducer(state: TopState, action: Action) {
  switch (action.type) {
    case 'SET_DATA_FORMAT':
      return {
        ...state,
        dataFormat: action.dataFormat,
      }
    case 'SET_EDITOR_MODE':
      return {
        ...state,
        editorMode: action.editorMode,
      }
    case 'SET_QUERY_TEXT':
      return {
        ...state,
        queryText: action.queryText,
      }
    case 'RUN_QUERY':
      return {
        ...state,
      }
    default:
      return state
  }
}

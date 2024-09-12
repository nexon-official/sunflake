import { Dispatch } from "react"
import { SunflakeState } from "types"
import { Action } from "./action"
import queryBuilderReducer from "./queryBuilder"
import snowflakeReducer from "./snowflake"
import timeSeriesReducer from "./timeSeries"
import topReducer from "./top"

export function reducer(state: SunflakeState, action: Action): SunflakeState {
  console.log('reducer:', action)

  return {
    ...state,
    ...(topReducer({ queryText: state.queryText, dataFormat: state.dataFormat, editorMode: state.editorMode }, action)),
    queryBuilder: queryBuilderReducer(state.queryBuilder, action),
    timeSeries: timeSeriesReducer(state.timeSeries, action),
    snowflakeObject: snowflakeReducer(state.snowflakeObject || {}, action),
  }
}

type StateChangeHandler = (state: SunflakeState) => void

export function useDispatch(onChange: StateChangeHandler, state: SunflakeState): Dispatch<Action> {
  const dispatch = (action: Action) => {
    const next = reducer(state, action)
    onChange(next)
    return next
  }
  return dispatch
}

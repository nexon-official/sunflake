import { Action } from "components/sunflake-editor/reducer"
import { DataSource } from "datasource"
import { Dispatch, createContext, useContext } from "react"
import { SunflakeState } from "types"
import { ActionFn } from "./reducer/action"
import useAsync, { CallbackFn } from "./useAsync"

export const sunflakeContext = createContext<SunflakeContext | null>(null)

export type SunflakeDispatch = Dispatch<Action>

export interface SunflakeContext {
  state: SunflakeState
  datasource: DataSource
  dispatch: SunflakeDispatch
  onChange: (state: SunflakeState) => void
  onRunQuery: () => void
}


export function useSunflakeContext(): SunflakeContext {
  const context = useContext(sunflakeContext)
  if (!context) {
    throw new Error("Cannot find the SunflakeContext")
  }

  return context
}

export const afterMounted = true

export function useAsyncDispatch<T>(actionFn: ActionFn<T>, callback: CallbackFn<T>, deps: React.DependencyList = [], afterMounted?: any, skip = false) {
  const { dispatch } = useSunflakeContext()
  return useAsync<T>(actionFn.name, callback, deps, afterMounted, skip, (t: T) => dispatch(actionFn(t)))
}

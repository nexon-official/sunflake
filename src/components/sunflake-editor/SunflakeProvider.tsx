import { useDispatch } from "components/sunflake-editor/reducer"
import { DataSource } from "datasource"
import React from "react"
import { SunflakeState } from "types"
import { sunflakeContext } from "./provider"

type SunflakeProviderProps = {
  datasource: DataSource
  state: SunflakeState,
  onChange: (state: SunflakeState) => void
  onRunQuery: () => void
  children: React.ReactNode
}

export function SunflakeProvider({ datasource, state, onChange, children, onRunQuery }: SunflakeProviderProps) {
  return (
    <sunflakeContext.Provider value={
      {
        datasource,
        state,
        onChange,
        onRunQuery,
        dispatch: useDispatch(onChange, state),
      }
    }>
      {children}
    </sunflakeContext.Provider>
  )
}

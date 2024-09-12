import { EditorField, EditorRow } from "@grafana/plugin-ui"
import { Input } from "@grafana/ui"
import React, { FormEvent } from "react"
import { DEFAULT_ROW_LIMIT, MAX_ROW_LIMIT } from "types"
import { useSunflakeContext } from "../provider"

export function SunflakeLimitRows() {
  const { state, dispatch } = useSunflakeContext()
  const { rowLimit = DEFAULT_ROW_LIMIT } = state.timeSeries || {}

  const onChangeLimit = (event: FormEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_LIMIT_ROWS', rowLimit: Number.parseInt(event.currentTarget.value, 10) })
  }

  return (
    <EditorRow>
      <EditorField label="Limit Rows" width={10}>
        <Input
          type="number"
          min={1}
          max={MAX_ROW_LIMIT}
          value={rowLimit}
          width={10}
          onChange={onChangeLimit}
        />
      </EditorField>
    </EditorRow>
  )
}

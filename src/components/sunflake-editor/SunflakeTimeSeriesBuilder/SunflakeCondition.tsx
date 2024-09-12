import { JsonTree } from "@react-awesome-query-builder/core"
import React, { useCallback } from "react"
import { SunflakeFilterColumns } from "../SunflakeFilterColumns"
import { useSunflakeContext } from "../provider"

export function SunflakeCondition() {
  const { state, dispatch } = useSunflakeContext()
  const { columnList = [] } = state.snowflakeObject || {}
  const { filterJsonTree } = state.timeSeries || {}

  const onChange = useCallback(
    (filterJsonTree: JsonTree, filterString: string) => {
      dispatch({ type: 'SET_FILTER_COLUMNS', filterJsonTree, filterString })
    },
    [dispatch]
  )

  return (
    <SunflakeFilterColumns
      columnList={columnList}
      onChange={onChange}
      jsonTree={filterJsonTree}
    />
  )
}

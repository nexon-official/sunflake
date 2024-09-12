import { JsonTree } from "@react-awesome-query-builder/core"
import React from "react"
import { useSunflakeContext } from "./provider"
import { SunflakeFilterColumns } from "./SunflakeFilterColumns"

export function SunflakeWhereClause() {
  const { state, dispatch } = useSunflakeContext()
  const { columnList = [] } = state.snowflakeObject || {}
  const { whereJsonTree } = state.queryBuilder || {}

  const onChange = (whereJsonTree: JsonTree, whereString: string) => {
    dispatch({ type: 'SET_QUERY_WHERE', whereJsonTree, whereString })
  }

  return (
    <SunflakeFilterColumns
      columnList={columnList}
      onChange={onChange}
      jsonTree={whereJsonTree}
    />
  )
}

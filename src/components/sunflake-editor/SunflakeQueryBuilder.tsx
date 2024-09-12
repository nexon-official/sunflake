import { Space } from "@grafana/plugin-ui"
import React from "react"
import { SunflakeGroupByClause, SunflakeOrderByClause, SunflakeQueryPreview, SunflakeSelectColumns, SunflakeSelectObjects, SunflakeWhereClause } from "."
import { afterMounted, useAsyncDispatch, useSunflakeContext } from "./provider"
import { SetColumnList, SetDatabaseList, SetSchemaList, SetTableList } from "./reducer/action"

export function SunflakeQueryBuilder() {
  const { state, datasource } = useSunflakeContext()

  const { snowflakeObject = {}, queryBuilder = {} } = state
  const {
    database,
    schema,
    table,
  } = snowflakeObject
  const {
    hasFilter = false,
    hasGroupBy = false,
    hasOrderBy = false,
  } = queryBuilder

  const [databaseState] = useAsyncDispatch(SetDatabaseList, () => datasource.getSnowflakeDatabases(), [])
  const [schemaState] = useAsyncDispatch(SetSchemaList, () => datasource.getSnowflakeSchemas(database), [database], afterMounted)
  const [tableState] = useAsyncDispatch(SetTableList, () => datasource.getSnowflakeTables(database, schema), [schema], afterMounted)
  const [columnState] = useAsyncDispatch(SetColumnList, () => datasource.getSnowflakeColumns(database, schema, table), [table], afterMounted)

  return (
    <>
      <SunflakeSelectObjects
        databaseState={databaseState}
        schemaState={schemaState}
        tableState={tableState}
      />

      <Space v={0.5} />
      <SunflakeSelectColumns
        columnState={columnState}
      />

      {hasFilter && (
        <>
          <Space v={0.5} />
          <SunflakeWhereClause />
        </>
      )}

      {hasGroupBy && (
        <>
          <Space v={0.5} />
          <SunflakeGroupByClause />
        </>
      )}

      {hasOrderBy && (
        <>
          <Space v={0.5} />
          <SunflakeOrderByClause />
        </>
      )}

      <Space v={0.5} />
      <SunflakeQueryPreview />
    </>
  )
}

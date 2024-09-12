import { Space } from "@grafana/plugin-ui"
import React from "react"
import { SunflakeCondition, SunflakeLimitRows, SunflakeLegend, SunflakeMetricAxis } from "."
import { SunflakeQueryPreview, SunflakeSelectObjects } from ".."
import { afterMounted, useAsyncDispatch, useSunflakeContext } from "../provider"
import { SetColumnList, SetDatabaseList, SetSchemaList, SetTableList } from "../reducer/action"
import { SunflakeTimeAxis } from "./SunflakeTimeAxis"

export function SunflakeTimeSeriesBuilder() {
  const { state, datasource } = useSunflakeContext()

  const { snowflakeObject = {} } = state
  const {
    database,
    schema,
    table,
  } = snowflakeObject

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
      <SunflakeTimeAxis columnState={columnState} />

      <Space v={0.5} />
      <SunflakeMetricAxis columnState={columnState} />

      <Space v={0.5} />
      <SunflakeLegend columnState={columnState} />

      <Space v={0.5} />
      <SunflakeCondition />

      <Space v={0.5} />
      <SunflakeLimitRows />

      <Space v={0.5} />
      <SunflakeQueryPreview />
    </>
  )
}

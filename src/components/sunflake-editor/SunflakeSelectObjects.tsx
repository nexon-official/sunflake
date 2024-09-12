import { SelectableValue } from "@grafana/data"
import { AsyncSelect } from "@grafana/ui"
import React from "react"
import { useSunflakeContext } from "./provider"
import { AsyncState } from "./useAsync"
import { EditorField, EditorRow } from "@grafana/plugin-ui"

type SunflakeSelectObjectsProps = {
  databaseState: AsyncState<string[]>
  schemaState: AsyncState<string[]>
  tableState: AsyncState<string[]>
}

export function SunflakeSelectObjects({ databaseState, schemaState, tableState }: SunflakeSelectObjectsProps) {
  const { state, dispatch } = useSunflakeContext()

  const {
    databaseList,
    schemaList,
    tableList,
    database,
    schema,
    table
  } = state.snowflakeObject || {}

  const onDatabaseChange = (option: SelectableValue) => {
    if (option.value === database) {
      return
    }
    dispatch({ type: 'SET_DATABASE', database: option.value })
  }

  const onSchemaChange = (option: SelectableValue) => {
    if (!database || option.value === schema) {
      return
    }

    dispatch({ type: 'SET_SCHEMA', schema: option.value })
  }

  const onTableChange = (option: SelectableValue) => {
    if (!database || !schema || table === option.value) {
      return
    }

    dispatch({ type: 'SET_TABLE', table: option.value })
  }

  return (
    <>
      <EditorRow>
        <EditorField label="Database" width={25}>
          <AsyncSelect
            options={toOptions(databaseList)}
            onChange={onDatabaseChange}
            value={{ label: database, value: database }}
            isLoading={databaseState.loading}
          />
        </EditorField>
        <EditorField label="Schema" width={25}>
          <AsyncSelect
            options={toOptions(schemaList)}
            onChange={onSchemaChange}
            value={{ label: schema, value: schema }}
            isLoading={schemaState.loading}
          />
        </EditorField>
        <EditorField label="Table" width={25}>
          <AsyncSelect
            options={toOptions(tableList)}
            onChange={onTableChange}
            value={{ label: table, value: table }}
            isLoading={tableState.loading}
          />
        </EditorField>
      </EditorRow>
    </>
  )
}

function toOptions(list?: string[]): SelectableValue[] {
  if (list) {
    return list.map((e) => ({ label: e, value: e }))
  } else {
    return []
  }
}

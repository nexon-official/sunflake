import { Space } from "@grafana/plugin-ui"
import { DataSource } from "datasource"
import React from "react"
import { DataFormat, EditorMode, SunflakeState } from "types"
import { SunflakeCodeEditor, SunflakeEditorHeader, SunflakeProvider, SunflakeQueryBuilder } from '.'
import SunflakeTimeSeriesBuilder from "./SunflakeTimeSeriesBuilder"

type SunflakeEditorProps = {
  datasource: DataSource,
  query: SunflakeState,
  onChange: (state: SunflakeState) => void
  onRunQuery: () => void
}

function SunflakeEditor({ datasource, query, onChange, onRunQuery }: SunflakeEditorProps) {
  const {
    editorMode = EditorMode.Code,
    dataFormat = DataFormat.TimeSeries,
  } = query

  return (
    <SunflakeProvider datasource={datasource} state={query} onChange={onChange} onRunQuery={onRunQuery}>
      <SunflakeEditorHeader />

      <Space v={0.5} />

      {(editorMode === EditorMode.Builder && dataFormat === DataFormat.Table) && (
        <SunflakeQueryBuilder />
      )}
      {(editorMode === EditorMode.Builder && dataFormat === DataFormat.TimeSeries) && (
        <SunflakeTimeSeriesBuilder />
      )}
      {editorMode === EditorMode.Code && (
        <SunflakeCodeEditor />
      )}
    </SunflakeProvider>
  )
}

export default SunflakeEditor

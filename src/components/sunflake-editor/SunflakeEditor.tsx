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
        // When the queryText changes in SunflakeCodeEditor, dispatch is called to update the content.
        // However, if the dataFormat is changed on the screen and then the query is modified,
        // onQueryTextChange refers to the previous dispatch, causing the changes to dataFormat to be lost.
        // In other words, the editor modifies the state as it was at the time it was mounted.
        // To address this, the editor must be remounted whenever dataFormat changes.
        // React will unmount the existing component and mount a new one when the key changes,
        // so ensure the key is appropriately updated.
        <SunflakeCodeEditor key={dataFormat} />
      )}
    </SunflakeProvider>
  )
}

export default SunflakeEditor

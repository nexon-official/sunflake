import { SelectableValue } from "@grafana/data"
import { EditorHeader, FlexItem, InlineSelect } from "@grafana/plugin-ui"
import { Button, InlineSwitch, RadioButtonGroup } from "@grafana/ui"
import React, { ChangeEvent } from "react"
import { DataFormat, EditorMode } from "types"
import { useSunflakeContext } from "./provider"
import buildQuery from "./buildQuery"

const QueryWritingModeOptions = [
  { label: 'Builder', value: EditorMode.Builder },
  { label: 'Code', value: EditorMode.Code },
]

const DataFormatOptions = [
  { label: 'Time series', value: DataFormat.TimeSeries },
  { label: 'Table', value: DataFormat.Table },
]

export function SunflakeEditorHeader() {
  const { state, dispatch, onRunQuery } = useSunflakeContext()

  const {
    dataFormat = DataFormat.TimeSeries,
    editorMode = EditorMode.Code,
    queryBuilder: {
      hasFilter,
      hasGroupBy,
      hasOrderBy,
    } = {
      hasFilter: false,
      hasGroupBy: false,
      hasOrderBy: false,
    }
  } = state

  const onDataFormatChange = (option: SelectableValue) => {
    dispatch({ type: 'SET_DATA_FORMAT', dataFormat: option.value })
  }

  const onEditorModeChange = (value: string) => {
    dispatch({ type: 'SET_EDITOR_MODE', editorMode: value })
  }

  const onFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_HAS_FILTER', hasFilter: event.target.checked })
  }

  const onGroupByChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_HAS_GROUP_BY', hasGroupBy: event.target.checked })
  }

  const onOrderByChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_HAS_ORDER_BY', hasOrderBy: event.target.checked })
  }

  const runQuery = () => {
    if (editorMode === EditorMode.Builder) {
      const queryText = buildQuery(state)
      dispatch({ type: 'SET_QUERY_TEXT', queryText })
    }

    console.log('onRunQuery: ', state.queryText)
    onRunQuery()
  }

  return (
    <>
      <EditorHeader>
        <InlineSelect
          label="Data Format"
          onChange={onDataFormatChange}
          options={DataFormatOptions}
          value={dataFormat}
        />
        {(editorMode === EditorMode.Builder && dataFormat === DataFormat.Table) && (
          <>
            <InlineSwitch
              label="Filter"
              transparent={true}
              showLabel={true}
              value={hasFilter}
              onChange={onFilterChange}
            />
            <InlineSwitch
              label="Group"
              transparent={true}
              showLabel={true}
              value={hasGroupBy}
              onChange={onGroupByChange}
            />
            <InlineSwitch
              label="Order"
              transparent={true}
              showLabel={true}
              value={hasOrderBy}
              onChange={onOrderByChange}
            />
          </>
        )}
        <FlexItem grow={1} />

        <Button icon="play" variant="primary" size="sm" onClick={() => runQuery()}>
          Run query
        </Button>

        <RadioButtonGroup
          options={QueryWritingModeOptions}
          value={editorMode}
          onChange={onEditorModeChange}
          size={"sm"}
        />
      </EditorHeader>
    </>
  )
}

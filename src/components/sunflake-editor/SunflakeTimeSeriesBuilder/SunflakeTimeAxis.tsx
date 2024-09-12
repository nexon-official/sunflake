import { SelectableValue } from "@grafana/data"
import { EditorField, EditorRow, EditorRows, Stack } from "@grafana/plugin-ui"
import { AsyncSelect, Select } from "@grafana/ui"
import { NumberInput } from "components/input/NumberInput"
import { toIcon } from "components/util"
import React, { useMemo } from "react"
import { DEFAULT_TIME_SERIES, FillMissing, TableColumn, TimeUnit } from "types"
import { useSunflakeContext } from "../provider"
import { AsyncState } from "../useAsync"

type timeAxisProps = {
  columnState: AsyncState<TableColumn[]>
}

export function SunflakeTimeAxis({ columnState }: timeAxisProps) {
  const { state, dispatch } = useSunflakeContext()

  const { timeSeries = DEFAULT_TIME_SERIES } = state
  const { timeColumn, interval, timeUnit, fillMissing } = timeSeries
  const { columnList = [] } = state.snowflakeObject || {}

  const onTimeColumnChange = (name: string) => {
    const column = columnList.find((column) => (column.name === name))
    if (column) {
      dispatch({ type: 'SET_TIME_COLUMN', column })
    }
  }

  const onIntervalChange = (interval: number) => {
    dispatch({ type: 'SET_TIME_INTERVAL', interval })
  }

  const onTimeunitChange = (timeUnit: string) => {
    dispatch({ type: 'SET_TIME_UNIT', timeUnit })
  }

  const onFillMissingChange = (fillMissing: string) => {
    dispatch({ type: 'SET_FILL_MISSING', fillMissing })
  }

  const timeUnitOptions: SelectableValue[] = useMemo(
    () => Object.entries(TimeUnit).map(([key, value]) => ({ label: key, value: value })),
    [])

  const fillMissingOptions: SelectableValue[] = useMemo(
    () => Object.entries(FillMissing).map(([key, value]) => ({ label: key, value: value })),
    [])

  return (
    <>
      <EditorRows>
        <EditorRow>
          <Stack gap={2} wrap direction="column">
            <Stack gap={2} alignItems="end">
              <EditorField label="X-Axis (time)" width={25}>
                <AsyncSelect
                  onChange={(option: SelectableValue) => onTimeColumnChange(option.value)}
                  options={toTimeOptions(columnList)}
                  value={{ label: timeColumn?.name, value: timeColumn?.name, type: timeColumn?.type }}
                  isLoading={columnState.loading}
                />
              </EditorField>
              <EditorField label="Interval" width={6}>
                <NumberInput
                  onChange={onIntervalChange}
                  defaultValue={1}
                  value={interval}
                  width={6}
                />
              </EditorField>
              <EditorField label="Time unit" width={12}>
                <Select
                  onChange={(option: SelectableValue) => onTimeunitChange(option.value)}
                  options={timeUnitOptions}
                  value={timeUnit}
                  width={12}
                />
              </EditorField>
              <EditorField label="Fill missing points" width={13}>
                <Select
                  onChange={(option: SelectableValue) => onFillMissingChange(option.value)}
                  options={fillMissingOptions}
                  value={fillMissing}
                  width={13}
                />
              </EditorField>
            </Stack>
          </Stack>
        </EditorRow>
      </EditorRows>
    </>
  )
}

function toTimeOptions(columnList: TableColumn[]): SelectableValue[] {
  return columnList
    .filter(isTimeType)
    .map((column) => ({ label: column.name, value: column.name, icon: toIcon(column.type) }))
}

function isTimeType(column: TableColumn): boolean {
  if (column.type.startsWith('TIMESTAMP')) {
    return true
  } else {
    return false
  }
}

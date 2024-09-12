import { css } from "@emotion/css"
import { SelectableValue } from "@grafana/data"
import { EditorField, EditorRow, EditorRows, Stack } from "@grafana/plugin-ui"
import { AsyncSelect, Button, Input, Select, useStyles2 } from "@grafana/ui"
import { toIcon } from "components/util"
import React, { ChangeEvent } from "react"
import { AggregateFunc, DEFAULT_METRIC_COLUMN, TableColumn } from "types"
import { useSunflakeContext } from "../provider"
import { AsyncState } from "../useAsync"

type SunflakeMetricAxisProps = {
  columnState: AsyncState<TableColumn[]>
}

export function SunflakeMetricAxis({ columnState }: SunflakeMetricAxisProps) {
  const styles = useStyles2(getStyles)
  const { state, dispatch } = useSunflakeContext()

  const { columnList = [] } = state.snowflakeObject || {}
  const { metrics = [DEFAULT_METRIC_COLUMN] } = state.timeSeries || {}

  const onColumnChange = (index: number, name: string) => {
    const i = columnList.findIndex(col => col.name === name)
    dispatch({ type: 'SET_METRIC_COLUMN', column: columnList[i], index })
  }

  const onAggFuncChange = (index: number, option?: SelectableValue) => {
    const { value } = option || {}
    dispatch({ type: 'SET_METRIC_AGG_FUNC', aggFunc: value, index })
  }

  const onAliasChange = (index: number, alias: string) => {
    dispatch({ type: 'SET_METRIC_ALIAS', alias, index })
  }

  const onRemoveClick = (index: number) => {
    dispatch({ type: 'DELETE_METRIC', index })
  }

  const onAddClick = () => {
    dispatch({ type: 'ADD_METRIC' })
  }

  return (
    <>
      <EditorRows>
        <EditorRow>
          <Stack gap={2} wrap direction="column">
            {metrics.map(({ column = {}, aggFunc, alias }, index) => (
              <Stack key={index} gap={2} alignItems="end">
                <EditorField label="Y-Axis (metric)" width={25}>
                  <AsyncSelect
                    onChange={(option: SelectableValue) => onColumnChange(index, option.value)}
                    options={toOptions(columnList)}
                    value={{ label: column.name, value: column.name, type: column.type }}
                    isLoading={columnState.loading}
                  />
                </EditorField>
                <EditorField label="Aggregation" width={12}>
                  <Select
                    onChange={(option: SelectableValue) => onAggFuncChange(index, option)}
                    options={AggFuncOptions}
                    value={aggFunc ? { label: aggFunc, value: aggFunc } : 'MAX'}
                  />
                </EditorField>
                <EditorField label="Label" optional width={25}>
                  <Input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onAliasChange(index, event.target.value)}
                    value={alias || ''}
                    width={25}
                    placeholder="Type an name"
                  />
                </EditorField>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon="trash-alt"
                  aria-label="Remove Column"
                  onClick={() => onRemoveClick(index)}
                />
              </Stack>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="plus"
              aria-label="Add Metric"
              onClick={onAddClick}
              className={styles.addButton}
            >Metric</Button>
          </Stack>
        </EditorRow>
      </EditorRows>
    </>
  )
}

const getStyles = () => {
  return { addButton: css({ alignSelf: 'flex-start' }) }
}

const AggFuncOptions = Object.entries(AggregateFunc).map(([k, v], i) => ({ label: k, value: v }))

function toOptions(columnList: TableColumn[]): SelectableValue[] {
  return columnList.map((column) => ({ label: column.name, value: column.name, icon: toIcon(column.type) }))
}

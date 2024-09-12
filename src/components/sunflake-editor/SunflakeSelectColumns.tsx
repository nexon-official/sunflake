import { css } from "@emotion/css"
import { SelectableValue } from "@grafana/data"
import { EditorField, EditorRow, EditorRows, Stack } from "@grafana/plugin-ui"
import { AsyncSelect, Button, Input, Select, useStyles2 } from "@grafana/ui"
import { toIcon } from "components/util"
import React, { ChangeEvent } from "react"
import { AggregateFunc, TableColumn } from "types"
import { useSunflakeContext } from "./provider"
import { AsyncState } from "./useAsync"

type SunflakeSelectColumnsProps = {
  columnState: AsyncState<TableColumn[]>
}

export function SunflakeSelectColumns({ columnState }: SunflakeSelectColumnsProps) {
  const styles = useStyles2(getStyles)
  const { state, dispatch } = useSunflakeContext()

  const { columnList = [] } = state.snowflakeObject || {}
  const { selectColumns = [{}] } = state.queryBuilder || {}

  const onNameChange = (index: number, name: string) => {
    const column = columnList.find(col => col.name === name)
    if (column) {
      dispatch({ type: 'SET_COLUMN_FIELD', column, index })
    }
  }

  const onAggFuncChange = (index: number, option?: SelectableValue) => {
    const { value } = option || {}
    dispatch({ type: 'SET_COLUMN_AGG_FUNC', aggFunc: value, index })
  }

  const onAliasChange = (index: number, alias: string) => {
    dispatch({ type: 'SET_COLUMN_ALIAS', alias, index })
  }

  const onRemoveClick = (index: number) => {
    dispatch({ type: 'DELETE_COLUMN', index })
  }

  const onAddClick = () => {
    dispatch({ type: 'ADD_COLUMN' })
  }

  return (
    <>
      <EditorRows>
        <EditorRow>
          <Stack gap={2} wrap direction="column">
            {selectColumns.map(({ column = {}, aggFunc, alias }, index) => (
              <Stack key={index} gap={2} alignItems="end">
                <EditorField label="Column" width={25}>
                  <AsyncSelect
                    onChange={(option: SelectableValue) => onNameChange(index, option.value)}
                    options={toOptions(columnList)}
                    value={{ label: column.name, value: column.name, type: column.type }}
                    isLoading={columnState.loading}
                  />
                </EditorField>
                <EditorField label="Aggregation" optional width={25}>
                  <Select
                    onChange={(option: SelectableValue) => onAggFuncChange(index, option)}
                    options={AggFuncOptions}
                    value={aggFunc ? { label: aggFunc, value: aggFunc } : null}
                    isClearable
                  />
                </EditorField>
                <EditorField label="Alias" optional width={25}>
                  <Input
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onAliasChange(index, event.target.value)}
                    value={alias || ''}
                    width={25}
                    placeholder="Type an alias"
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
              aria-label="Add Column"
              onClick={onAddClick}
              className={styles.addButton}
            >Column</Button>
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

import { css } from "@emotion/css"
import { GrafanaTheme2, SelectableValue } from "@grafana/data"
import { EditorField, EditorRow, InputGroup, Stack } from "@grafana/plugin-ui"
import { Button, Select, useStyles2 } from "@grafana/ui"
import { toTableColumnOptions } from "components/util/icon"
import React from "react"
import { TableColumn } from "types"
import { useSunflakeContext } from "../provider"
import { AsyncState } from "../useAsync"

type timeAxisProps = {
  columnState: AsyncState<TableColumn[]>
}

export function SunflakeLegend({ columnState }: timeAxisProps) {
  const styles = useStyles2(getButtonStyles)
  const { state, dispatch } = useSunflakeContext()
  const { columnList = [] } = state.snowflakeObject || {}
  const { lineIdentifiers = [] } = state.timeSeries || {}

  const onClickAdd = () => (dispatch({ type: 'ADD_LINE_IDENTIFIER' }))
  const onClickDelete = (index: number) => { dispatch({ type: 'DELETE_LINE_IDENTIFIER', index }) }
  const onChangeColumn = (index: number, name: string) => (dispatch({ type: 'SET_LINE_IDENTIFIER', name, index }))

  return (
    <EditorRow>
      <EditorField label="Legend" optional>
        <Stack>
          {lineIdentifiers.map((name, index) => (
            <InputGroup key={index}>
              <Select
                aria-label="Legend"
                options={toTableColumnOptions(columnList)}
                onChange={(option: SelectableValue) => onChangeColumn(index, option.value)}
                value={name}
              />
              <Button onClick={() => onClickDelete(index)} aria-label="Remove legend" icon="times" variant="secondary" className={styles.button} />
            </InputGroup>
          ))}
          <Button onClick={onClickAdd} variant="secondary" size="md" icon="plus" aria-label="Add" type="button" />
        </Stack>
      </EditorField>
    </EditorRow>
  )
}

const getButtonStyles = (theme: GrafanaTheme2) => ({
  button: css({
    paddingLeft: theme.spacing(3 / 2),
    paddingRight: theme.spacing(3 / 2),
  }),
})

import { css } from "@emotion/css"
import { GrafanaTheme2, SelectableValue } from "@grafana/data"
import { EditorField, EditorRow, InputGroup, Stack } from "@grafana/plugin-ui"
import { Button, Select, useStyles2 } from "@grafana/ui"
import { toTableColumnOptions } from "components/util/icon"
import React from "react"
import { useSunflakeContext } from "./provider"

export function SunflakeGroupByClause() {
  const styles = useStyles2(getButtonStyles)
  const { state, dispatch } = useSunflakeContext()
  const { columnList = [] } = state.snowflakeObject || {}
  const { groupByColumns = [] } = state.queryBuilder || {}

  const onClickAdd = () => (dispatch({ type: 'ADD_GROUP_BY' }))
  const onClickDelete = (index: number) => { dispatch({ type: 'DELETE_GROUP_BY', index }) }
  const onChangeColumn = (index: number, name: string) => (dispatch({ type: 'SET_GROUP_BY', name, index }))

  return (
    <EditorRow>
      <EditorField label="Group by column">
        <Stack>
          {groupByColumns.map((name, index) => (
            <InputGroup key={index}>
              <Select
                aria-label="Group By"
                options={toTableColumnOptions(columnList)}
                onChange={(option: SelectableValue) => onChangeColumn(index, option.value)}
                value={name}
              />
              <Button onClick={() => onClickDelete(index)} aria-label="Remove group by column" icon="times" variant="secondary" className={styles.button} />
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

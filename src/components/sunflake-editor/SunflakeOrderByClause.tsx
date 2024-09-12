import { SelectableValue } from "@grafana/data"
import { EditorField, EditorRow, InputGroup } from "@grafana/plugin-ui"
import { Input, RadioButtonGroup, Select } from "@grafana/ui"
import { toTableColumnOptions } from "components/util/icon"
import React, { FormEvent } from "react"
import { SelectColumn, SortOrder, TableColumn } from "types"
import { useSunflakeContext } from "./provider"

export function SunflakeOrderByClause() {
  const { state, dispatch } = useSunflakeContext()
  const { columnList = [] } = state.snowflakeObject || {}
  const { selectColumns = [], orderByColumn = {} } = state.queryBuilder || {}

  const onChangeName = (option: SelectableValue) => (dispatch({ type: 'SET_ORDER_BY_NAME', name: option ? option.value : undefined }))
  const onChangeSortOrder = (sortOrder: SortOrder) => (dispatch({ type: 'SET_ORDER_BY_SORT_ORDER', sortOrder }))
  const onChangeLimit = (event: FormEvent<HTMLInputElement>) => (dispatch({ type: 'SET_ORDER_BY_LIMIT', limit: Number.parseInt(event.currentTarget.value, 10) }))

  return (
    <EditorRow>
      <EditorField label="Order by" width={25}>
        <InputGroup>
          <Select
            aria-label="Order By"
            isClearable
            options={toOrderByOptions(selectColumns, columnList)}
            onChange={onChangeName}
            value={orderByColumn.name}
          />
          <RadioButtonGroup
            options={sortOrderOptions}
            disabled={!orderByColumn.name}
            onChange={onChangeSortOrder}
            value={orderByColumn.sortOrder}
          />
        </InputGroup>
      </EditorField>
      <EditorField label="Limit" optional width={25}>
        <Input
          type="number"
          min={0}
          value={orderByColumn.limit}
          onChange={onChangeLimit}
        />
      </EditorField>
    </EditorRow>
  )
}

const sortOrderOptions = [
  { description: 'Sort by ascending', value: 'ASC', icon: 'sort-amount-up' } as const,
  { description: 'Sort by descending', value: 'DESC', icon: 'sort-amount-down' } as const,
]


function toOrderByOptions(selectColumns: SelectColumn[], columnList: TableColumn[]): SelectableValue[] {
  const selectOptions = selectColumns.map(({ column = {}, aggFunc }, index) => {
    const exp = (aggFunc) ? `${aggFunc}(${column.name})` : column.name
    return {
      value: exp,
      label: `${index + 1} - ${exp}`,
    }
  })

  return [{
    value: '',
    label: 'Selected columns',
    options: selectOptions,
    expanded: true,
  },
  ...toTableColumnOptions(columnList),
  ]
}

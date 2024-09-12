import { SelectableValue } from "@grafana/data"
import { TableColumn } from "types"

export function toIcon(dataType?: string): string {
  if (!dataType) {
    return ''
  } else if (dataType === 'TEXT') {
    return 'clipboard-alt'
  } else if (dataType.startsWith('TIMESTAMP')) {
    return 'clock-nine'
  } else if (dataType === 'NUMBER' || dataType === 'FLOAT') {
    return 'calculator-alt'
  } else if (dataType === 'DATE') {
    return 'calendar-alt'
  } else if (dataType === 'TIME') {
    return 'stopwatch-slash'
  }
  return dataType
}

export function toTableColumnOptions(columnList: TableColumn[]): SelectableValue[] {
  return columnList.map((column) => (toTableColumnOption(column)))
}

export function toTableColumnOption(column: TableColumn): SelectableValue {
  return ({ label: column.name, value: column.name, icon: toIcon(column.type) })
}

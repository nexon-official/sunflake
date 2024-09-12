import { QueryEditorProps } from '@grafana/data'
import React from 'react'
import { DataSource } from '../datasource'
import { SunflakeDataSourceOptions, SunflakeState } from '../types'
import SunflakeEditor from './sunflake-editor'

type Props = QueryEditorProps<DataSource, SunflakeState, SunflakeDataSourceOptions>

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  return (
    <SunflakeEditor
      datasource={datasource}
      query={query}
      onChange={onChange}
      onRunQuery={onRunQuery}
    />
  )
}

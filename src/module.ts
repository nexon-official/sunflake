import { DataSourcePlugin } from '@grafana/data'
import { DataSource } from './datasource'
import { ConfigEditor } from './components/ConfigEditor'
import { QueryEditor } from './components/QueryEditor'
import { SunflakeState, SunflakeDataSourceOptions } from './types'

export const plugin = new DataSourcePlugin<DataSource, SunflakeState, SunflakeDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)

import {
  CoreApp,
  DataFrame,
  DataFrameView,
  DataSourceInstanceSettings,
  LegacyMetricFindQueryOptions,
  MetricFindValue,
  ScopedVars,
  TimeRange,
  VariableWithMultiSupport,
  getDefaultTimeRange,
  getSearchFilterScopedVar,
} from '@grafana/data';
import {
  BackendDataSourceResponse,
  DataSourceWithBackend,
  FetchResponse,
  TemplateSrv,
  getBackendSrv,
  getTemplateSrv,
  toDataQueryResponse,
} from '@grafana/runtime';

import { DataQuery } from '@grafana/schema';
import { uniqBy } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { DEFAULT_STATE, DataFormat, SunflakeDataSourceOptions, SunflakeState, TableColumn } from './types';

export class DataSource extends DataSourceWithBackend<SunflakeState, SunflakeDataSourceOptions> {
  constructor(
    instanceSettings: DataSourceInstanceSettings<SunflakeDataSourceOptions>,
    protected readonly templateSrv: TemplateSrv = getTemplateSrv()
  ) {
    super(instanceSettings);
  }

  getDefaultQuery(_: CoreApp): Partial<SunflakeState> {
    return DEFAULT_STATE;
  }

  async metricFindQuery(query: string, options?: LegacyMetricFindQueryOptions): Promise<MetricFindValue[]> {
    const range = options?.range;
    if (range == null) {
      return [];
    }
    let refId = 'tempvar';
    if (options && options.variable && options.variable.name) {
      refId = options.variable.name;
    }

    const scopedVars = {
      ...options?.scopedVars,
      ...getSearchFilterScopedVar({ query, wildcardChar: '%', options }),
    };

    const rawSql = this.templateSrv.replace(query, scopedVars, this.interpolateVariable);

    const sunflakeQuery: SunflakeState = {
      refId: refId,
      queryText: rawSql,
      dataFormat: DataFormat.Table,
    };

    // Retrieve DataQueryResponse based on query.
    const response = await this.runMetaQuery(sunflakeQuery, range);

    // Convert query results to a MetricFindValue[]
    return this.transformMetricFindResponse(response);
  }

  private runMetaQuery(request: Partial<SunflakeState>, range: TimeRange): Promise<DataFrame> {
    const refId = request.refId || 'meta';
    const queries: DataQuery[] = [{ ...request, datasource: request.datasource || this.getRef(), refId }];

    return lastValueFrom(
      getBackendSrv()
        .fetch<BackendDataSourceResponse>({
          url: '/api/ds/query',
          method: 'POST',
          headers: this.getRequestHeaders(),
          data: {
            from: range.from.valueOf().toString(),
            to: range.to.valueOf().toString(),
            queries,
          },
          requestId: refId,
        })
        .pipe(
          map((res: FetchResponse<BackendDataSourceResponse>) => {
            const rsp = toDataQueryResponse(res, queries);
            return rsp.data[0] ?? { fields: [] };
          })
        )
    );
  }

  private transformMetricFindResponse(frame: DataFrame): MetricFindValue[] {
    const metricValues: MetricFindValue[] = [];
    const textField = frame.fields.find((f) => f.name.toUpperCase() === '__TEXT');
    const valueField = frame.fields.find((f) => f.name.toUpperCase() === '__VALUE');

    if (textField && valueField) {
      const texts = typeof textField.values === 'object' ? textField.values.map((v) => v) : textField.values;
      const values = typeof valueField.values === 'object' ? valueField.values.map((v) => v) : valueField.values;

      for (let i = 0; i < texts.length; i++) {
        metricValues.push({ text: '' + texts[i], value: '' + values[i] });
      }
    } else {
      for (const field of frame.fields) {
        for (const value of field.values) {
          metricValues.push({ text: value });
        }
      }
    }

    return uniqBy(metricValues, 'text');
  }

  quoteLiteral = (value: any, variable: VariableWithMultiSupport): any => {
    if (typeof value === 'string') {
      const val = value.replace(/'/g, "''");
      if (variable.multi || variable.includeAll) {
        return "'" + val + "'";
      } else {
        return val;
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    if (Array.isArray(value)) {
      const quotedValues = value.map((v) => this.quoteLiteral(v, variable));
      return quotedValues.join(',');
    }

    return value;
  };

  interpolateVariable = (value: string | string[] | number, variable: VariableWithMultiSupport) => {
    return this.quoteLiteral(value, variable);
  };

  applyTemplateVariables(query: SunflakeState, scopedVars: ScopedVars): Record<string, any> {
    // When using multi var, AwesomeQueryBuilder generates the "in" condition as "IN ('$var')",
    // which converts to "IN (''var'')", causing duplicate quotes. The following line fixes this.
    const sql = query.queryText.replace(/IN \('\$(\w+)'\)/g, 'IN ($$$1)');
    const queryText = getTemplateSrv().replace(sql, scopedVars, this.interpolateVariable);

    return {
      ...query,
      queryText,
    };
  }

  filterQuery(query: SunflakeState): boolean {
    // if no query has been provided, prevent the query from being executed
    return !!query.queryText && !query.hide;
  }

  // Snowflake Interface
  async runSql(queryText: string, refId: string) {
    const range = getDefaultTimeRange();
    const dataFormat = DataFormat.Table;
    const frame = await this.runMetaQuery({ refId, queryText, dataFormat }, range);
    return new DataFrameView<string[]>(frame);
  }

  async getSnowflakeDatabases(searchWord?: string): Promise<string[]> {
    const sql = searchWord && searchWord.trim() ? `SHOW DATABASES LIKE '%${searchWord}%'` : `SHOW DATABASES`;
    return await this.getStringsFromQueryResult(sql, 'databases', 'name');
  }

  async getSnowflakeSchemas(database?: string, searchWord?: string): Promise<string[]> {
    if (!database || !database.trim()) {
      return [];
    }

    let sql = `SHOW SCHEMAS IN DATABASE ${database}`;
    if (searchWord && searchWord.trim()) {
      sql = sql + ` LIKE '%${searchWord}%'`;
    }

    return await this.getStringsFromQueryResult(sql, 'schemas', 'name');
  }

  async getSnowflakeTables(database?: string, schema?: string, searchWord?: string): Promise<string[]> {
    if (!database || !database.trim() || !schema || !schema.trim()) {
      return [];
    }

    let sql = `SELECT table_name FROM ${database.toLowerCase()}.information_schema.tables WHERE table_schema = '${schema}'`;
    if (searchWord && searchWord.trim()) {
      sql = sql + ` AND table_name LIKE '%${searchWord}%'`;
    }
    sql = sql + ' ORDER BY table_name';

    return await this.getStringsFromQueryResult(sql, 'tables', 'TABLE_NAME');
  }

  async getSnowflakeColumns(
    database?: string,
    schema?: string,
    table?: string,
    searchWord?: string
  ): Promise<TableColumn[]> {
    if (!database || !database.trim() || !schema || !schema.trim() || !table || !table.trim()) {
      return [];
    }

    let sql = `SELECT column_name AS "name", data_type AS "type" FROM ${database.toLowerCase()}.information_schema.columns WHERE table_schema = '${schema}' AND table_name = '${table}'`;
    if (searchWord && searchWord.trim()) {
      sql = sql + ` AND column_name LIKE '%${searchWord}%'`;
    }
    sql = sql + ' ORDER BY column_name';

    return await this.getRowsFromQueryResult<TableColumn>(sql, 'columns');
  }

  async getStringsFromQueryResult(sql: string, refId: string, col: string): Promise<string[]> {
    const view = await this.runSql(sql, refId);
    const nameIndex = view.dataFrame.fields.findIndex((field) => field.name === col);
    const names = view.map((row) => {
      return row[nameIndex];
    });

    return names;
  }

  async getRowsFromQueryResult<T>(sql: string, refId: string): Promise<T[]> {
    const view = await this.runSql(sql, refId);
    const fieldNames = view.dataFrame.fields.reduce((names, field) => {
      return [...names, field.name];
    }, [] as string[]);
    const rows = view.map((vs) => {
      const row = fieldNames.reduce((row, fieldName, i) => {
        return {
          ...row,
          [fieldName]: vs[i],
        };
      }, {} as T);

      return row;
    });

    return rows;
  }
}

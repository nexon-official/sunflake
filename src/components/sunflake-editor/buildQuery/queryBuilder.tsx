import { OrderByColumn, QueryBuilder, SelectColumn, SnowflakeObject } from "types"

export function buildSqlForQueryBuilder(snowflakeObject: SnowflakeObject, queryBuilder: QueryBuilder): string {
  const {
    hasFilter = false,
    hasGroupBy = false,
    hasOrderBy = false,
    selectColumns = [],
    whereString = '',
    groupByColumns = [],
    orderByColumn = {}
  } = queryBuilder

  try {
    return toSelectStmt(selectColumns)
      + toFromStmt(snowflakeObject)
      + toWhereStmt(hasFilter, whereString)
      + toGroupByStmt(hasGroupBy, groupByColumns)
      + toOrderByStmt(hasOrderBy, orderByColumn)
  } catch (error: any) {
    return error
  }
}

function toSelectStmt(cols: SelectColumn[]) {
  const stmt = cols.map(selected => {
    if (!selected.column) {
      return undefined
    }

    const { column } = selected
    const exp = (selected.aggFunc) ? `${selected.aggFunc}(${column.name})` : column.name
    const stmt = selected.alias ? `${exp} AS "${selected.alias}"` : exp

    return stmt
  }).join(',')

  return stmt ? `SELECT ${stmt}` : 'SELECT *'
}

function toFromStmt(snowflakeObject: SnowflakeObject) {
  const stmt = snowflakeObject.table ? [snowflakeObject.database, snowflakeObject.schema, snowflakeObject.table].join('.') : ''
  return stmt ? ` FROM ${stmt}` : ''
}

function toWhereStmt(hasFilter: boolean, whereString: string) {
  if (!hasFilter) {
    return ''
  }

  if (!whereString) {
    return ''
  }

  return ' WHERE ' + whereString
}

function toGroupByStmt(hasGroupBy: boolean, groupByColumns: string[]) {
  if (!hasGroupBy) {
    return ''
  }

  const stmt = groupByColumns.filter(col => Boolean(col)).join(',')
  return stmt ? ` GROUP BY ${stmt}` : ''
}

function toOrderByStmt(hasOrderBy: boolean, orderByColumn: OrderByColumn) {
  if (!hasOrderBy) {
    return ''
  }

  const { name, sortOrder, limit } = orderByColumn

  const orderBy = name ? [name, sortOrder].join(' ') : ''
  const orderByStmt = orderBy ? ` ORDER BY ${orderBy}` : ''
  const limitStmt = limit ? ` LIMIT ${limit}` : ''

  return orderByStmt + limitStmt
}

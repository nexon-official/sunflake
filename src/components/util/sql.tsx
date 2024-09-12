import sqlFormatter from "snowsql-formatter"

export function formatSQL(q: string) {
  // Fix the issue where formatting the query breaks the macro starting with $__.
  return sqlFormatter.format(q).replace(/(\$ \{ .* \})|(\$ __)|(\$ \w+)/g, (m: string) => {
    return m.replace(/\s/g, '')
  })
}

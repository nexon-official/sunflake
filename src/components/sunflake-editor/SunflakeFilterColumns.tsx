import { injectGlobal } from "@emotion/css"
import { EditorField, EditorRow } from "@grafana/plugin-ui"
import { Config, ImmutableTree, JsonTree, Utils } from "@react-awesome-query-builder/core"
import { Builder, BuilderProps, Query } from "@react-awesome-query-builder/ui"
import { emptyInitTree, raqbConfig } from "components/grafana/AwesomeQueryBuilder"
import { toIcon } from "components/util"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { DEFAULT_COLUMN_LIST, TableColumn } from "types"

type SunflakeFilterColumnsProps = {
  columnList: TableColumn[]
  jsonTree?: JsonTree
  onChange: (whereJsonTree: JsonTree, whereString: string) => void
}

// If columnList is undefined in useMemo, assigning [] will create a new [] value that differs from the previous value, causing an infinite loop.
// Therefore, DEFAULT_COLUMN_LIST should be assigned and used instead.
export function SunflakeFilterColumns({ columnList = DEFAULT_COLUMN_LIST, jsonTree, onChange }: SunflakeFilterColumnsProps) {
  const [tree, setTree] = useState<ImmutableTree>(Utils.loadTree(emptyInitTree))

  const config = useMemo(() => {
    console.log('useMemo => config: columnList', columnList)
    // Ensure the tree is initialized before modifying the config to prevent errors
    setTree(Utils.loadTree(emptyInitTree))
    const fields = mapFieldsToTypes(columnList)
    return ({ ...raqbConfig, fields })
  }, [columnList])

  useEffect(() => {
    console.log('useEffect => setTree:', config)
    setTree(Utils.loadTree(jsonTree || emptyInitTree))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  const onTreeChange = useCallback((changedTree: ImmutableTree, cfg: Config) => {
    if (columnList.length <= 0) {
      return
    }

    console.log('onTreeChange:', changedTree)
    setTree(changedTree)
    const whereJsonTree = Utils.getTree(changedTree)
    const whereString = Utils.sqlFormat(changedTree, cfg) || ''
    
    onChange(whereJsonTree, whereString)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, onChange])

  return (
    <>
      <EditorRow>
        <EditorField label="Condition" optional>
          <Query
            {...config}
            value={tree}
            renderBuilder={(props: BuilderProps) => (<Builder {...props} />)}
            onChange={onTreeChange}
          />
        </EditorField>
      </EditorRow>
    </>
  )
}

function toFieldType(t: string) {
  if (t.startsWith('TIMESTAMP')) {
    return 'datetime'
  } else if (t === 'FLOAT') {
    return 'number'
  }
  return t.toLowerCase()
}

function mapFieldsToTypes(columns: TableColumn[]) {
  const fields: Config['fields'] = {}
  for (const col of columns) {
    if (col.name && col.type) {
      fields[col.name] = {
        type: toFieldType(col.type),
        valueSources: ['value'],
        mainWidgetProps: { customProps: { icon: toIcon(col.type) } },
      }
    }
  }
  return fields
}

function flex(direction: string) {
  return `
    display: flex;
    gap: 8px;
    flex-direction: ${direction};`
}

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
injectGlobal`
  .group--header {
    ${flex('row')}
  }

  .group-or-rule {
    ${flex('column')}
    .rule {
      flex-direction: row;
    }
  }

  .rule--body {
    ${flex('row')}
  }

  .group--children {
    ${flex('column')}
  }

  .group--conjunctions:empty {
    display: none;
  }
`

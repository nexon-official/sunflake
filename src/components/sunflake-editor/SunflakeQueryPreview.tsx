import { css } from "@emotion/css"
import { GrafanaTheme2 } from "@grafana/data"
import { EditorRow } from "@grafana/plugin-ui"
import { CodeEditor, Field, useStyles2 } from "@grafana/ui"
import { formatSQL } from "components/util/sql"
import React from "react"
import { tryBuildQuery } from "./buildQuery/buildQuery"
import { useSunflakeContext } from "./provider"

export function SunflakeQueryPreview() {
  const styles = useStyles2(getStyles)
  const { state } = useSunflakeContext()
  const sql = tryBuildQuery(state, '')

  return (
    <EditorRow>
      <Field label="Preview" className={styles.grow}>
        <CodeEditor
          language="sql"
          height={250}
          value={formatSQL(sql)}
          readOnly={true}
          showMiniMap={false}
          showLineNumbers={true}
        />
      </Field>
    </EditorRow>
  )
}

function getStyles(theme: GrafanaTheme2) {
  return {
    grow: css({ flexGrow: 1 }),
  }
}

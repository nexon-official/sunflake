import { css } from "@emotion/css"
import { CodeEditor, HorizontalGroup, Icon, IconButton, Modal, Tooltip, monacoTypes, useTheme2 } from "@grafana/ui"
import { formatSQL } from "components/util/sql"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useMeasure } from "react-use"
import AutoSizer from "react-virtualized-auto-sizer"
import { useSunflakeContext } from "./provider"
import { EditorMode } from "types"

export function SunflakeCodeEditor() {
  const theme = useTheme2()
  const styles = useMemo(() => {
    return {
      grow: css({ flexGrow: 1 }),
      container: css({
        border: `1px solid ${theme.colors.border.medium}`,
        borderTop: 'none',
        padding: theme.spacing(0.5, 0.5, 0.5, 0.5),
        display: 'flex',
        flexGrow: 1,
        justifyContent: 'space-between',
        fontSize: theme.typography.bodySmall.fontSize,
      }),
      hint: css({
        color: theme.colors.text.disabled,
        whiteSpace: 'nowrap',
        cursor: 'help',
      }),
      modal: css({
        width: '95vw',
        height: '95vh',
      }),
      modalContent: css({
        height: '100%',
        paddingTop: 0,
      }),
    }
  }, [theme])
  const { state, dispatch, onRunQuery } = useSunflakeContext()
  const { refId, queryText, editorMode } = state

  const [editorRef, editorMeasure] = useMeasure<HTMLDivElement>()
  const [isExpanded, setExpanded] = useState(false)

  const onQueryTextChange = (text: string, needToRunQuery = false) => {
    dispatch({ type: 'SET_QUERY_TEXT', queryText: text })

    if (needToRunQuery) {
      onRunQuery()
    }
  }

  const onRunCommand = (queryText: string) => {
    console.log('onRunCommand =>', isExpanded)
    if (editorMode === EditorMode.Code) {
      onQueryTextChange(queryText, true)
    }
  }

  const monacoRef = useRef<[monacoTypes.editor.IStandaloneCodeEditor | null, number | null]>([null, null])
  const onEditorDidMount = (editor: monacoTypes.editor.IStandaloneCodeEditor, monaco: typeof monacoTypes): void => {
    monacoRef.current = [editor, monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter]
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunCommand(editor.getValue())
    })
  }

  useEffect(() => {
    return () => {
      // componentWillUnmount
      const [editor, key] = monacoRef.current
      if (editor && key) {
        // remove the command
        editor.addCommand(key, () => {})
        editor.dispose()
      }
    }
  }, [])

  const renderEditor = () => (
    isExpanded ? (
      <AutoSizer>
        {({ width, height }: { width: number, height: number }) => renderQueryEditor(width, height)}
      </AutoSizer>
    ) : (
      <div ref={editorRef}>
        {renderQueryEditor()}
      </div>
    )
  )

  const renderQueryEditor = (width?: number, height?: number) => (
    <>
      <CodeEditor
        language="sql"
        width={width ? `${width - 2}px` : undefined}
        height={height || '250px'}
        value={queryText}
        readOnly={false}
        showMiniMap={isExpanded}
        showLineNumbers={true}
        onChange={onQueryTextChange}
        onEditorDidMount={onEditorDidMount}
      />
      <div className={styles.container}>
        <HorizontalGroup spacing="sm" justify="flex-end">
          <IconButton
            onClick={() => onQueryTextChange(formatSQL(queryText))}
            name="brackets-curly"
            size="xs"
            tooltip="Format query"
          />
          <IconButton
            onClick={() => setExpanded(!isExpanded)}
            name={isExpanded ? 'angle-up' : 'angle-down'}
            size="xs"
            tooltip={isExpanded ? 'Collapse editor' : 'Expand editor'}
          />
          <Tooltip content="Hit CTRL/CMD+Return to run query">
            <Icon className={styles.hint} name="keyboard" />
          </Tooltip>
        </HorizontalGroup>
      </div>
    </>
  )

  const renderDisabledEditor = () => (
    <div style={{
      width: editorMeasure.width,
      height: editorMeasure.height,
      background: theme.colors.background.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      Editing in expanded code editor
    </div>
  )

  const renderEditorModal = () => (
    <Modal
      title={`Query ${refId}`}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      className={styles.modal}
      contentClassName={styles.modalContent}
      isOpen={isExpanded}
      onDismiss={() => setExpanded(false)}
    >
      {renderEditor()}
    </Modal>
  )

  return (
    <>
      {isExpanded ? renderDisabledEditor() : renderEditor()}
      {isExpanded && renderEditorModal()}
    </>
  )
}

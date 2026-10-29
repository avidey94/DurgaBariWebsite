'use client'

import { BlocksField, useField } from '@payloadcms/ui'
import type { BlocksFieldClientComponent } from 'payload'
import { useEffect, useRef } from 'react'

const messageType = 'durga-bari-section-highlight'
const rowPattern = /^layout-row-(\d+)$/
type ActiveRow = { rowId: string; index: number } | null

function postHighlight(row: ActiveRow) {
  const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement | null
  if (!iframe?.contentWindow || !iframe.src || new URL(iframe.src).origin !== window.location.origin) return
  iframe.contentWindow.postMessage({ type: messageType, rowId: row?.rowId ?? null, index: row?.index ?? null }, window.location.origin)
}

function rowIndex(target: EventTarget | null, root: HTMLElement | null): number | null {
  let element = target instanceof Element ? target : null
  while (element && element !== root) {
    const match = rowPattern.exec(element.id)
    if (match) return Number(match[1])
    element = element.parentElement
  }
  return null
}

export const SectionPreviewField: BlocksFieldClientComponent = (props) => {
  const root = useRef<HTMLDivElement>(null)
  const activeRow = useRef<ActiveRow>(null)
  const { rows = [] } = useField({ path: props.path || props.field.name, hasRows: true })

  const highlight = (index: number | null) => {
    const rowId = index === null ? null : rows[index]?.id || null
    if ((rowId === null && activeRow.current === null) || (rowId === activeRow.current?.rowId && index === activeRow.current?.index)) return
    activeRow.current = rowId === null || index === null ? null : { rowId, index }
    postHighlight(activeRow.current)
  }

  useEffect(() => {
    const onPreviewReady = (event: MessageEvent) => {
      const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement | null
      if (event.origin !== window.location.origin || event.source !== iframe?.contentWindow) return
      if (event.data?.type === 'durga-bari-preview-ready') postHighlight(activeRow.current)
    }
    window.addEventListener('message', onPreviewReady)
    return () => window.removeEventListener('message', onPreviewReady)
  }, [])

  return <div
    ref={root}
    onPointerOver={(event) => {
      const index = rowIndex(event.target, root.current)
      if (index !== null) highlight(index)
    }}
    onPointerLeave={() => highlight(null)}
    onFocusCapture={(event) => highlight(rowIndex(event.target, root.current))}
    onBlurCapture={(event) => {
      if (!root.current?.contains(event.relatedTarget as Node | null)) highlight(null)
    }}
  >
    <BlocksField {...props} />
  </div>
}

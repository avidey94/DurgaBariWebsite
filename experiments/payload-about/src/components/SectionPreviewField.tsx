'use client'

import { BlocksField, useField } from '@payloadcms/ui'
import type { BlocksFieldClientComponent } from 'payload'
import { useEffect, useRef } from 'react'

const messageType = 'durga-bari-section-highlight'
const rowPattern = /^layout-row-(\d+)$/
type ActiveRow = { rowId: string; index: number } | null
type DragState = {
  pointerId: number
  startX: number
  startY: number
  source: HTMLElement
  rowId: string | null
  sourceIndex: number
  destinationIndex: number
  total: number
  started: boolean
  hasPosted: boolean
  target: HTMLElement | null
  frame: number | null
}

function postHighlight(row: ActiveRow) {
  const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement | null
  if (!iframe?.contentWindow || !iframe.src || new URL(iframe.src).origin !== window.location.origin) return
  iframe.contentWindow.postMessage({ type: messageType, rowId: row?.rowId ?? null, index: row?.index ?? null }, window.location.origin)
}

function postDrag(state: DragState, phase: 'moving' | 'dropped' | 'cancelled') {
  const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement | null
  if (!iframe?.contentWindow || !iframe.src || new URL(iframe.src).origin !== window.location.origin) return
  iframe.contentWindow.postMessage({
    type: 'durga-bari-section-placement',
    phase,
    rowId: state.rowId,
    sourceIndex: state.sourceIndex,
    destinationIndex: state.destinationIndex,
    total: state.total,
  }, window.location.origin)
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

function rowElement(target: Element | null, root: HTMLElement | null): HTMLElement | null {
  let element = target
  while (element && element !== root) {
    if (element instanceof HTMLElement && rowPattern.test(element.id)) return element
    element = element.parentElement
  }
  return null
}

export const SectionPreviewField: BlocksFieldClientComponent = (props) => {
  const root = useRef<HTMLDivElement>(null)
  const activeRow = useRef<ActiveRow>(null)
  const drag = useRef<DragState | null>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      if (event.data?.type === 'durga-bari-preview-ready') {
        if (drag.current?.started) postDrag(drag.current, 'moving')
        else postHighlight(activeRow.current)
      }
    }
    window.addEventListener('message', onPreviewReady)
    return () => window.removeEventListener('message', onPreviewReady)
  }, [])

  useEffect(() => {
    const updateDestination = () => {
      const state = drag.current
      const container = root.current
      if (!state || !container || !state.source.isConnected) return
      state.frame = null
      // A touch can scroll the form before Payload activates its delayed drag sensor.
      if (!state.source.style.transform) return

      container.dataset.dragging = 'true'
      state.started = true
      const rowElements = Array.from(container.querySelectorAll<HTMLElement>('[id^="layout-row-"]'))
        .filter((row) => rowPattern.test(row.id))
      const sourceIndex = Number(rowPattern.exec(state.source.id)?.[1])
      let destination = sourceIndex
      // Payload shifts every row crossed by the dragged block. Those shifts are
      // its own projected order, so the marker always agrees with the drop.
      rowElements.forEach((row) => {
        if (row === state.source) return
        const offset = row.style.transform ? new DOMMatrixReadOnly(row.style.transform).m42 : 0
        const index = Number(rowPattern.exec(row.id)?.[1])
        if (offset < -1) destination = Math.max(destination, index)
        if (offset > 1) destination = Math.min(destination, index)
      })

      if (destination !== state.destinationIndex || !state.hasPosted) {
        state.destinationIndex = destination
        state.hasPosted = true
        postDrag(state, 'moving')
      }

      const nextTarget = destination === sourceIndex ? null : rowElements.find((row) => row.id === `layout-row-${destination}`) || null
      if (state.target !== nextTarget) {
        if (state.target) {
          delete state.target.dataset.dropTarget
          delete state.target.dataset.dropLabel
        }
        state.target = nextTarget
        if (nextTarget) {
          nextTarget.dataset.dropTarget = destination > sourceIndex ? 'after' : 'before'
          nextTarget.dataset.dropLabel = `Position ${String(destination + 1).padStart(2, '0')}`
        }
      }
      state.frame = requestAnimationFrame(updateDestination)
    }

    const onPointerMove = (event: PointerEvent) => {
      const state = drag.current
      if (!state || event.pointerId !== state.pointerId) return
      if (Math.hypot(event.clientX - state.startX, event.clientY - state.startY) < 5) return
      if (state.frame === null) state.frame = requestAnimationFrame(updateDestination)
    }

    const finishDrag = (event?: PointerEvent, cancelled = false) => {
      const state = drag.current
      if (!state || (event && event.pointerId !== state.pointerId)) return
      if (state.frame !== null) cancelAnimationFrame(state.frame)
      if (state.target) {
        delete state.target.dataset.dropTarget
        delete state.target.dataset.dropLabel
      }
      if (state.started) postDrag(state, cancelled ? 'cancelled' : 'dropped')
      delete state.source.dataset.dragSource
      const container = root.current
      if (container) {
        delete container.dataset.dragging
        delete container.dataset.dragPending
        container.dataset.dragSettling = 'true'
        settleTimer.current = setTimeout(() => {
          delete container.dataset.dragSettling
          settleTimer.current = null
        }, 220)
      }
      drag.current = null
    }

    const onCancel = (event: PointerEvent) => finishDrag(event, true)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishDrag(undefined, true)
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKeyDown)
      if (settleTimer.current) clearTimeout(settleTimer.current)
      if (drag.current?.frame !== null && drag.current?.frame !== undefined) cancelAnimationFrame(drag.current.frame)
    }
  }, [])

  return <div
    ref={root}
    className="section-sorter"
    onPointerDownCapture={(event) => {
      if (!(event.target instanceof Element) || !event.target.closest('.collapsible__drag')) return
      const source = rowElement(event.target, root.current)
      if (!source || !root.current) return
      if (settleTimer.current) clearTimeout(settleTimer.current)
      delete root.current.dataset.dragSettling
      root.current.dataset.dragPending = 'true'
      source.dataset.dragSource = 'true'
      const sourceIndex = Number(rowPattern.exec(source.id)?.[1])
      drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, source, rowId: rows[sourceIndex]?.id || null, sourceIndex, destinationIndex: sourceIndex, total: rows.length, started: false, hasPosted: false, target: null, frame: null }
    }}
    onPointerOver={(event) => {
      if (drag.current?.started) return
      const index = rowIndex(event.target, root.current)
      if (index !== null) highlight(index)
    }}
    onPointerLeave={() => { if (!drag.current?.started) highlight(null) }}
    onFocusCapture={(event) => highlight(rowIndex(event.target, root.current))}
    onBlurCapture={(event) => {
      if (!root.current?.contains(event.relatedTarget as Node | null)) highlight(null)
    }}
  >
    <BlocksField {...props} />
  </div>
}

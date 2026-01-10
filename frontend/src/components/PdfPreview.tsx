import type { ApiFile } from '../types/graphql'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { BUTTONS } from '../constants/ui'
import { formatSize } from '../utils/format'
import { getErrorMessage } from '../utils/errors'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const ZOOM_MIN = 0.7
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

type PdfPreviewProps = {
  file: ApiFile | null
  token: string
  onDownload: (file: ApiFile) => void
}

export const PdfPreview = ({ file, token, onDownload }: PdfPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setPageNumber(1)
    setPageCount(null)
    setZoom(1)
  }, [file?.id])

  useEffect(() => {
    if (!file) {
      setPdfUrl(null)
      setError(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    setPdfUrl(null)
    const load = async () => {
      try {
        const response = await fetch(file.downloadUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error('Preview unavailable.')
        }
        const blob = await response.blob()
        if (!active) return
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (err) {
        if (!active) return
        setError(getErrorMessage(err))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [file?.id, file?.downloadUrl, token])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const pageLabel = pageCount ? `${pageNumber} / ${pageCount}` : 'Page --'
  const zoomLabel = `${Math.round(zoom * 100)}%`
  const disabledClass = 'disabled:cursor-not-allowed disabled:opacity-50'
  const baseWidth = containerWidth ? Math.max(280, containerWidth - 32) : undefined
  const renderWidth = baseWidth ? Math.floor(baseWidth * zoom) : undefined

  const details = useMemo(() => {
    if (!file) return null
    return `${formatSize(file.size)} - Updated ${new Date(file.updatedAt).toLocaleDateString()}`
  }, [file])

  const canZoomIn = zoom < ZOOM_MAX - 0.01
  const canZoomOut = zoom > ZOOM_MIN + 0.01
  const canPrev = pageNumber > 1
  const canNext = pageCount ? pageNumber < pageCount : false

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-border bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Preview</div>
          <div className="font-sans text-sm font-semibold text-ink">
            {file ? file.name : 'Select a PDF to preview'}
          </div>
          <div className="text-xs text-muted">{details ?? 'PDF previews render inside the room.'}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1">
            <button
              className={`${BUTTONS.icon} ${disabledClass}`}
              disabled={!file || !canZoomOut}
              onClick={() => setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP))}
            >
              -
            </button>
            <span className="text-xs text-muted">{zoomLabel}</span>
            <button
              className={`${BUTTONS.icon} ${disabledClass}`}
              disabled={!file || !canZoomIn}
              onClick={() => setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP))}
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
            <button
              className={`${BUTTONS.icon} ${disabledClass}`}
              disabled={!file || !canPrev}
              onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            >
              &lt;
            </button>
            <span className="text-xs text-muted">{pageLabel}</span>
            <button
              className={`${BUTTONS.icon} ${disabledClass}`}
              disabled={!file || !canNext}
              onClick={() => setPageNumber((prev) => Math.min(pageCount ?? prev, prev + 1))}
            >
              &gt;
            </button>
          </div>
          <button
            className={`${BUTTONS.outline} ${disabledClass}`}
            disabled={!file || loading}
            onClick={() => file && onDownload(file)}
          >
            Download
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex min-h-[420px] flex-1 items-center justify-center overflow-auto rounded-lg border border-dashed border-border bg-paper/70 p-4"
      >
        {!file ? (
          <div className="text-sm text-muted">Choose a file to preview its pages.</div>
        ) : loading ? (
          <div className="text-sm text-muted">Loading preview...</div>
        ) : error ? (
          <div className="text-sm text-muted">{error}</div>
        ) : pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages)
              setPageNumber((prev) => Math.min(Math.max(prev, 1), numPages))
            }}
            onLoadError={(err) => setError(getErrorMessage(err))}
            loading={<div className="text-sm text-muted">Rendering pages...</div>}
          >
            <Page pageNumber={pageNumber} width={renderWidth} />
          </Document>
        ) : (
          <div className="text-sm text-muted">Preview unavailable.</div>
        )}
      </div>
    </div>
  )
}

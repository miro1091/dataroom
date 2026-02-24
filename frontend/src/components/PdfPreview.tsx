import {
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ApiFile } from '../types/graphql'
import { getErrorMessage } from '../utils/errors'
import { formatSize } from '../utils/format'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

const ZOOM_MIN = 0.7
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

type PdfPreviewProps = {
  file: ApiFile
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
  }, [file.id])

  useEffect(() => {
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
  }, [file.id, file.downloadUrl, token])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const pageLabel = pageCount ? `${pageNumber} / ${pageCount}` : 'Page --'
  const zoomLabel = `${Math.round(zoom * 100)}%`
  const baseWidth = containerWidth ? Math.max(280, containerWidth - 24) : undefined
  const renderWidth = baseWidth ? Math.floor(baseWidth * zoom) : undefined

  const details = useMemo(
    () => `${formatSize(file.size)}  |  Updated ${new Date(file.updatedAt).toLocaleDateString()}`,
    [file],
  )

  const canZoomIn = zoom < ZOOM_MAX - 0.01
  const canZoomOut = zoom > ZOOM_MIN + 0.01
  const canPrev = pageNumber > 1
  const canNext = pageCount ? pageNumber < pageCount : false

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box>
        <Typography variant="subtitle1" noWrap title={file.name}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {details}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Zoom out">
            <span>
              <IconButton size="small" disabled={!canZoomOut} onClick={() => setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP))}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 44, textAlign: 'center' }}>
            {zoomLabel}
          </Typography>
          <Tooltip title="Zoom in">
            <span>
              <IconButton size="small" disabled={!canZoomIn} onClick={() => setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP))}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Previous page">
            <span>
              <IconButton size="small" disabled={!canPrev} onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}>
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 58, textAlign: 'center' }}>
            {pageLabel}
          </Typography>
          <Tooltip title="Next page">
            <span>
              <IconButton
                size="small"
                disabled={!canNext}
                onClick={() => setPageNumber((prev) => Math.min(pageCount ?? prev, prev + 1))}
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadOutlinedIcon fontSize="small" />}
          disabled={loading}
          onClick={() => onDownload(file)}
        >
          Download
        </Button>
      </Stack>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 380,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          p: 1.5,
          overflow: 'auto',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#f8fbff',
        }}
      >
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading preview...
          </Typography>
        ) : error ? (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        ) : pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages)
              setPageNumber((prev) => Math.min(Math.max(prev, 1), numPages))
            }}
            onLoadError={(err) => setError(getErrorMessage(err))}
            loading={<Typography variant="body2" color="text.secondary">Rendering pages...</Typography>}
          >
            <Page pageNumber={pageNumber} width={renderWidth} />
          </Document>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Preview unavailable.
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

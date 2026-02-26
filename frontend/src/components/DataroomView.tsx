import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import type { ChangeEvent, ReactNode } from 'react'
import type { ApiDataroom, ApiFile, ApiFolder } from '../types/graphql'
import { formatSize } from '../utils/format'

type DataroomViewProps = {
  dataroom: ApiDataroom
  breadcrumb: ApiFolder[]
  folders: ApiFolder[]
  files: ApiFile[]
  selectedFile: ApiFile | null
  highlightFileId: number | null
  loading: boolean
  error?: string
  onRoot: () => void
  onNavigateFolder: (id: number) => void
  onCreateFolder: () => void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onOpenFolder: (folder: ApiFolder) => void
  onRenameFolder: (folder: ApiFolder) => void
  onDeleteFolder: (folder: ApiFolder) => void
  onSelectFile: (file: ApiFile) => void
  onRenameFile: (file: ApiFile) => void
  onDeleteFile: (file: ApiFile) => void
  preview: ReactNode
}

export const DataroomView = ({
  dataroom,
  breadcrumb,
  folders,
  files,
  selectedFile,
  highlightFileId,
  loading,
  error,
  onRoot,
  onNavigateFolder,
  onCreateFolder,
  onUpload,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onSelectFile,
  onRenameFile,
  onDeleteFile,
  preview,
}: DataroomViewProps) => {
  const renderFolders = () => {
    if (folders.length === 0) {
      return <Alert severity="info">No folders here yet.</Alert>
    }

    return (
      <Stack spacing={1.25}>
        {folders.map((folder) => (
          <Paper key={folder.id} variant="outlined" sx={{ p: 1.25 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Button
                variant="text"
                color="inherit"
                startIcon={<FolderOutlinedIcon />}
                onClick={() => onOpenFolder(folder)}
                sx={{ justifyContent: 'flex-start', flex: 1, textTransform: 'none' }}
              >
                <Stack spacing={0.25} alignItems="flex-start">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {folder.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated {new Date(folder.updatedAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Button>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => onRenameFolder(folder)}>
                  Rename
                </Button>
                <Button size="small" color="error" onClick={() => onDeleteFolder(folder)}>
                  Delete
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    )
  }

  const renderFiles = () => {
    if (files.length === 0) {
      return <Alert severity="info">Upload your first PDF to share with stakeholders.</Alert>
    }

    return (
      <Stack spacing={1.25}>
        {files.map((file) => {
          const isActive = selectedFile?.id === file.id || highlightFileId === file.id
          return (
            <Paper
              key={file.id}
              variant="outlined"
              sx={{
                p: 1.25,
                borderColor: isActive ? 'primary.main' : 'divider',
                bgcolor: isActive ? 'action.hover' : 'background.paper',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<DescriptionOutlinedIcon />}
                  onClick={() => onSelectFile(file)}
                  sx={{ justifyContent: 'flex-start', flex: 1, textTransform: 'none' }}
                >
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {file.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Updated {new Date(file.updatedAt).toLocaleDateString()}
                      </Typography>
                      <Chip label={formatSize(file.size)} size="small" />
                    </Stack>
                  </Stack>
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => onRenameFile(file)}>
                    Rename
                  </Button>
                  <Button size="small" color="error" onClick={() => onDeleteFile(file)}>
                    Delete
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )
        })}
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
      >
        <Box>
          <Typography variant="h5">{dataroom.name}</Typography>
          <Breadcrumbs aria-label="dataroom breadcrumb" sx={{ mt: 0.75 }}>
            <Link component="button" underline="hover" color="inherit" onClick={onRoot}>
              Home
            </Link>
            {breadcrumb.map((folder) => (
              <Link
                key={folder.id}
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => onNavigateFolder(folder.id)}
              >
                {folder.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={onCreateFolder}>
            New folder
          </Button>
          <Button variant="contained" component="label">
            Upload PDF
            <input hidden type="file" accept="application/pdf" onChange={onUpload} />
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Alert severity="info">Loading contents…</Alert>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Folders
            </Typography>
            <Box sx={{ mt: 1 }}>{renderFolders()}</Box>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">
              Files
            </Typography>
            <Box
              sx={{
                mt: 1,
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,1fr) minmax(0,1.2fr)' },
              }}
            >
              <Box>{renderFiles()}</Box>
              {preview}
            </Box>
          </Box>
        </Stack>
      )}
    </Stack>
  )
}

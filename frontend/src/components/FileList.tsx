import { Alert, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import type { ApiFile } from '../types/graphql'
import { formatSize } from '../utils/format'

type FileListProps = {
  files: ApiFile[]
  selectedFileId: number | null
  highlightFileId: number | null
  onSelect: (file: ApiFile) => void
  onRename: (file: ApiFile) => void
  onDelete: (file: ApiFile) => void
}

export const FileList = ({
  files,
  selectedFileId,
  highlightFileId,
  onSelect,
  onRename,
  onDelete,
}: FileListProps) => {
  if (files.length === 0) {
    return <Alert severity="info">Upload your first PDF to share with stakeholders.</Alert>
  }

  return (
    <Stack spacing={1.25}>
      {files.map((file) => {
        const isActive = selectedFileId === file.id || highlightFileId === file.id
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
                onClick={() => onSelect(file)}
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
                <Button size="small" onClick={() => onRename(file)}>
                  Rename
                </Button>
                <Button size="small" color="error" onClick={() => onDelete(file)}>
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

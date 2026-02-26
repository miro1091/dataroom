import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import type { ApiFolder } from '../types/graphql'

type FolderListProps = {
  folders: ApiFolder[]
  onOpen: (folder: ApiFolder) => void
  onRename: (folder: ApiFolder) => void
  onDelete: (folder: ApiFolder) => void
}

export const FolderList = ({ folders, onOpen, onRename, onDelete }: FolderListProps) => {
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
              onClick={() => onOpen(folder)}
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
              <Button size="small" onClick={() => onRename(folder)}>
                Rename
              </Button>
              <Button size="small" color="error" onClick={() => onDelete(folder)}>
                Delete
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}

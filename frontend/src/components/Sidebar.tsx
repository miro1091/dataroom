import AddIcon from '@mui/icons-material/Add'
import { Alert, Button, IconButton, Paper, Stack, Typography } from '@mui/material'
import type { ApiDataroom } from '../types/graphql'

type SidebarProps = {
  datarooms: ApiDataroom[]
  loading: boolean
  error?: string
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onRename: (room: ApiDataroom) => void
  onDelete: (room: ApiDataroom) => void
}

export const Sidebar = ({
  datarooms,
  loading,
  error,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: SidebarProps) => {
  return (
    <Paper variant="outlined" sx={{ minHeight: '70vh', p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.25}>
            <Typography variant="h6">Datarooms</Typography>
            <Typography variant="body2" color="text.secondary">
              {datarooms.length} active rooms
            </Typography>
          </Stack>
          <IconButton onClick={onCreate} aria-label="Create dataroom">
            <AddIcon />
          </IconButton>
        </Stack>

        {loading ? <Alert severity="info">Loading datarooms…</Alert> : null}
        {!loading && error ? <Alert severity="error">{error}</Alert> : null}
        {!loading && !error && datarooms.length === 0 ? (
          <Alert severity="info">Create your first dataroom to begin.</Alert>
        ) : null}

        {!loading && !error && datarooms.length > 0 ? (
          <Stack spacing={1.25}>
            {datarooms.map((room) => (
              <Paper
                key={room.id}
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderColor: selectedId === room.id ? 'primary.main' : 'divider',
                  bgcolor: selectedId === room.id ? 'action.hover' : 'background.paper',
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
                    onClick={() => onSelect(room.id)}
                    sx={{ justifyContent: 'flex-start', flex: 1, textTransform: 'none' }}
                  >
                    <Stack spacing={0.25} alignItems="flex-start">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {room.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Updated {new Date(room.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Button>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => onRename(room)}>
                      Rename
                    </Button>
                    <Button size="small" color="error" onClick={() => onDelete(room)}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}

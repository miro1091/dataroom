import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { formatSize } from '../utils/format'

export type DriveItem = {
  key: string
  kind: 'folder' | 'file'
  id: number
  name: string
  createdAt: string
  updatedAt: string
  size: number | null
  contentType: string | null
  highlighted: boolean
}

type DriveTableProps = {
  items: DriveItem[]
  selectedItemKey: string | null
  onSelect: (item: DriveItem) => void
  onOpen: (item: DriveItem) => void
  onRename: (item: DriveItem) => void
  onDelete: (item: DriveItem) => void
}

const formatDate = (value: string) => new Date(value).toLocaleDateString()
const itemTypeLabel = (item: DriveItem) => (item.kind === 'folder' ? 'Folder' : item.contentType || 'File')

export const DriveTable = ({
  items,
  selectedItemKey,
  onSelect,
  onOpen,
  onRename,
  onDelete,
}: DriveTableProps) => {
  return (
    <Stack spacing={1.5}>
      {items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1">This folder is empty</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create a folder or upload PDF files to get started.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="dataroom contents">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Size</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const isSelected = selectedItemKey === item.key || item.highlighted
                return (
                  <TableRow
                    key={item.key}
                    hover
                    selected={isSelected}
                    onClick={() => onSelect(item)}
                    onDoubleClick={() => onOpen(item)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {item.kind === 'folder' ? (
                          <FolderOutlinedIcon color="primary" fontSize="small" />
                        ) : (
                          <DescriptionOutlinedIcon color="action" fontSize="small" />
                        )}
                        <Typography variant="body2" noWrap title={item.name}>
                          {item.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{itemTypeLabel(item)}</TableCell>
                    <TableCell align="right">{item.size !== null ? formatSize(item.size) : '-'}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={item.kind === 'folder' ? 'Open folder' : 'Open file'}>
                          <IconButton size="small" onClick={() => onOpen(item)}>
                            <OpenInNewOutlinedIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rename">
                          <IconButton size="small" onClick={() => onRename(item)}>
                            <DriveFileRenameOutlineIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                            <DeleteOutlineIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  )
}

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import {
  Box,
  Checkbox,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
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

type DriveSortColumn = 'name' | 'type' | 'size' | 'createdAt' | 'updatedAt'
type DriveSortDirection = 'asc' | 'desc'

type DriveTableProps = {
  items: DriveItem[]
  selectedItemKey: string | null
  selectedBulkKeys: string[]
  sortBy: DriveSortColumn
  sortDirection: DriveSortDirection
  filePage: number
  filePageSize: number
  fileTotal: number
  onSortChange: (column: DriveSortColumn) => void
  onToggleItemSelection: (itemKey: string, checked: boolean) => void
  onToggleAllVisibleItems: (visibleItemKeys: string[], checked: boolean) => void
  onFilePageChange: (page: number) => void
  onFilePageSizeChange: (size: number) => void
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
  selectedBulkKeys,
  sortBy,
  sortDirection,
  filePage,
  filePageSize,
  fileTotal,
  onSortChange,
  onToggleItemSelection,
  onToggleAllVisibleItems,
  onFilePageChange,
  onFilePageSizeChange,
  onSelect,
  onOpen,
  onRename,
  onDelete,
}: DriveTableProps) => {
  const selectedBulkKeySet = useMemo(() => new Set(selectedBulkKeys), [selectedBulkKeys])
  const visibleItemKeys = useMemo(
    () => items.map((item) => item.key),
    [items],
  )
  const hasRows = fileTotal > 0
  const selectedVisibleCount = visibleItemKeys.filter((key) => selectedBulkKeySet.has(key)).length
  const allVisibleItemsSelected =
    visibleItemKeys.length > 0 && selectedVisibleCount === visibleItemKeys.length
  const hasVisibleSelection = selectedVisibleCount > 0

  const renderSortLabel = (column: DriveSortColumn, label: string) => (
    <TableSortLabel
      active={sortBy === column}
      direction={sortBy === column ? sortDirection : 'asc'}
      onClick={() => onSortChange(column)}
    >
      {label}
    </TableSortLabel>
  )

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
                <TableCell padding="checkbox" sx={{ width: 48 }}>
                  <Checkbox
                    indeterminate={hasVisibleSelection && !allVisibleItemsSelected}
                    checked={allVisibleItemsSelected}
                    disabled={visibleItemKeys.length === 0}
                    onChange={(_, checked) => onToggleAllVisibleItems(visibleItemKeys, checked)}
                    inputProps={{ 'aria-label': 'Select all rows on this page' }}
                  />
                </TableCell>
                <TableCell>{renderSortLabel('name', 'Name')}</TableCell>
                <TableCell>{renderSortLabel('type', 'Type')}</TableCell>
                <TableCell align="right">{renderSortLabel('size', 'Size')}</TableCell>
                <TableCell>{renderSortLabel('createdAt', 'Created')}</TableCell>
                <TableCell>{renderSortLabel('updatedAt', 'Updated')}</TableCell>
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
                    <TableCell
                      padding="checkbox"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedBulkKeySet.has(item.key)}
                        onChange={(_, checked) => onToggleItemSelection(item.key, checked)}
                        inputProps={{ 'aria-label': `Select ${item.kind} ${item.name}` }}
                      />
                    </TableCell>
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
      {hasRows ? (
        <TablePagination
          component="div"
          count={fileTotal}
          page={filePage}
          onPageChange={(_, page) => onFilePageChange(page)}
          rowsPerPage={filePageSize}
          onRowsPerPageChange={(event) =>
            onFilePageSizeChange(Number.parseInt(event.target.value, 10))
          }
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Rows per page"
        />
      ) : null}
    </Stack>
  )
}

import { useApolloClient } from '@apollo/client'
import AddIcon from '@mui/icons-material/Add'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import DriveFolderUploadOutlinedIcon from '@mui/icons-material/DriveFolderUploadOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import {
  Alert,
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Paper,
  Stack,
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'

import { AuthGate } from './components/AuthGate'
import { DialogModal } from './components/DialogModal'
import { DriveTable, type DriveItem } from './components/DriveTable'
import { NoticeToast } from './components/NoticeToast'
import { PdfPreview } from './components/PdfPreview'
import { SearchDropdown } from './components/SearchDropdown'
import { useAuthToken } from './hooks/useAuthToken'
import { type DriveSortColumn, useDataroomState } from './hooks/useDataroomState'
import type { AuthCredentials } from './types/auth'
import type { ApiDataroom, ApiFile, ApiFolder } from './types/graphql'
import { requestRegister, requestToken } from './utils/authApi'

const DATAROOM_NAME_MAX_LENGTH = 255

const AppShell = ({ token, onSignOut }: { token: string; onSignOut: () => void }) => {
  const {
    datarooms,
    dataroomLoading,
    dataroomError,
    activeDataroom,
    selectedDataroomId,
    currentFolderId,
    breadcrumb,
    folders,
    files,
    contentsItems,
    contentsLoading,
    contentsError,
    selectedFile,
    highlightFileId,
    sortBy,
    sortDirection,
    filePage,
    filePageSize,
    filesTotal,
    notice,
    dialog,
    dialogValue,
    dialogBusy,
    dialogError,
    setSelectedDataroomId,
    setCurrentFolderId,
    setSelectedFile,
    setHighlightFileId,
    setSortBy,
    setSortDirection,
    setFilePage,
    setFilePageSize,
    setDialogValue,
    openInputDialog,
    openConfirmDialog,
    closeDialog,
    handleDialogConfirm,
    handleCreateDataroom,
    handleRenameDataroom,
    handleDeleteDataroom,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleDeleteFolders,
    handleUpload,
    handleUploadFiles,
    handleRenameFile,
    handleDeleteFile,
    handleDeleteFiles,
    openFileLocation,
  } = useDataroomState()

  const [dragActive, setDragActive] = useState(false)
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const [selectedBulkKeys, setSelectedBulkKeys] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders])
  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file])), [files])

  const items = useMemo<DriveItem[]>(() => {
    return contentsItems.map((item) => ({
      key: item.key,
      kind: item.kind === 'folder' ? 'folder' : 'file',
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      size: item.size ?? null,
      contentType: item.contentType ?? null,
      highlighted: item.kind === 'file' && highlightFileId === item.id,
    }))
  }, [contentsItems, highlightFileId])

  useEffect(() => {
    setSelectedItemKey(null)
  }, [selectedDataroomId, currentFolderId])

  useEffect(() => {
    setSelectedBulkKeys([])
  }, [selectedDataroomId, currentFolderId])

  const downloadFile = async (file: ApiFile) => {
    try {
      const response = await fetch(file.downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to download file.')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  const openCreateDataroom = () =>
    openInputDialog({
      kind: 'input',
      title: 'Create dataroom',
      label: 'Dataroom name',
      confirmLabel: 'Create',
      maxLength: DATAROOM_NAME_MAX_LENGTH,
      onConfirm: handleCreateDataroom,
    })

  const openRenameDataroom = (room: ApiDataroom) =>
    openInputDialog({
      kind: 'input',
      title: 'Rename dataroom',
      label: 'New name',
      confirmLabel: 'Save',
      defaultValue: room.name,
      maxLength: DATAROOM_NAME_MAX_LENGTH,
      onConfirm: (value) => handleRenameDataroom(room, value),
    })

  const openDeleteDataroom = (room: ApiDataroom) =>
    openConfirmDialog({
      kind: 'confirm',
      title: 'Delete dataroom',
      description: 'This removes all folders, files, and audit history.',
      confirmLabel: 'Delete',
      onConfirm: () => handleDeleteDataroom(room),
    })

  const openCreateFolder = () =>
    openInputDialog({
      kind: 'input',
      title: 'Create folder',
      label: 'Folder name',
      confirmLabel: 'Create',
      maxLength: 30,
      onConfirm: handleCreateFolder,
    })

  const openRenameFolder = (folder: ApiFolder) =>
    openInputDialog({
      kind: 'input',
      title: 'Rename folder',
      label: 'New name',
      confirmLabel: 'Save',
      defaultValue: folder.name,
      maxLength: 30,
      onConfirm: (value) => handleRenameFolder(folder, value),
    })

  const openDeleteFolder = (folder: ApiFolder) =>
    openConfirmDialog({
      kind: 'confirm',
      title: 'Delete folder',
      description: 'This deletes all nested folders and files inside it.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await handleDeleteFolder(folder)
        setSelectedBulkKeys((prev) => prev.filter((key) => key !== `folder-${folder.id}`))
      },
    })

  const openRenameFile = (file: ApiFile) =>
    openInputDialog({
      kind: 'input',
      title: 'Rename file',
      label: 'New name',
      confirmLabel: 'Save',
      defaultValue: file.name,
      maxLength: 30,
      onConfirm: (value) => handleRenameFile(file, value),
    })

  const openDeleteFile = (file: ApiFile) =>
    openConfirmDialog({
      kind: 'confirm',
      title: 'Delete file',
      description: 'This removes the file from the dataroom.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await handleDeleteFile(file)
        setSelectedBulkKeys((prev) => prev.filter((key) => key !== `file-${file.id}`))
      },
    })

  const openDeleteSelectedItems = () => {
    const count = selectedBulkKeys.length
    if (count === 0) return

    const folderIds = selectedBulkKeys
      .filter((key) => key.startsWith('folder-'))
      .map((key) => Number.parseInt(key.replace('folder-', ''), 10))
      .filter((id) => Number.isFinite(id))
    const fileIds = selectedBulkKeys
      .filter((key) => key.startsWith('file-'))
      .map((key) => Number.parseInt(key.replace('file-', ''), 10))
      .filter((id) => Number.isFinite(id))

    openConfirmDialog({
      kind: 'confirm',
      title: 'Delete selected items',
      description: `This removes ${count} selected item(s). Selected folders are deleted recursively, including child folders and files.`,
      confirmLabel: `Delete ${count}`,
      onConfirm: async () => {
        if (folderIds.length > 0) {
          await handleDeleteFolders(folderIds)
        }
        if (fileIds.length > 0) {
          await handleDeleteFiles(fileIds)
        }
        setSelectedBulkKeys([])
      },
    })
  }

  const openDriveItem = (item: DriveItem) => {
    if (item.kind === 'folder') {
      setCurrentFolderId(item.id)
      setHighlightFileId(null)
      return
    }

    const file = fileById.get(item.id)
    if (file) {
      setSelectedFile(file)
      setHighlightFileId(null)
    }
  }

  const selectDriveItem = (item: DriveItem) => {
    setSelectedItemKey(item.key)
    if (item.kind === 'file') {
      const file = fileById.get(item.id)
      if (file) {
        setSelectedFile(file)
      }
    }
  }

  const renameDriveItem = (item: DriveItem) => {
    if (item.kind === 'folder') {
      const folder = folderById.get(item.id)
      if (folder) {
        openRenameFolder(folder)
      }
      return
    }

    const file = fileById.get(item.id)
    if (file) {
      openRenameFile(file)
    }
  }

  const deleteDriveItem = (item: DriveItem) => {
    if (item.kind === 'folder') {
      const folder = folderById.get(item.id)
      if (folder) {
        openDeleteFolder(folder)
      }
      return
    }

    const file = fileById.get(item.id)
    if (file) {
      openDeleteFile(file)
    }
  }

  const handleSearchSelect = (item: {
    id: number
    dataroomId: number
    folderId?: number | null
  }) => {
    openFileLocation(item.dataroomId, item.folderId ?? null, item.id)
    setSelectedItemKey(`file-${item.id}`)
  }

  const triggerFileDialog = () => {
    inputRef.current?.click()
  }

  const onUploadInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleUpload(event)
  }

  const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    const dropped = Array.from(event.dataTransfer.files)
    if (dropped.length) {
      void handleUploadFiles(dropped)
    }
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
  }

  const onSortChange = (column: DriveSortColumn) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortBy(column)
    setSortDirection('asc')
  }

  const onToggleItemSelection = (itemKey: string, checked: boolean) => {
    setSelectedBulkKeys((prev) => {
      if (checked) {
        return prev.includes(itemKey) ? prev : [...prev, itemKey]
      }
      return prev.filter((key) => key !== itemKey)
    })
  }

  const onToggleAllVisibleItems = (visibleItemKeys: string[], checked: boolean) => {
    setSelectedBulkKeys((prev) => {
      const next = new Set(prev)
      visibleItemKeys.forEach((key) => {
        if (checked) {
          next.add(key)
        } else {
          next.delete(key)
        }
      })
      return Array.from(next)
    })
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ px: { xs: 1, md: 1.5 } }}
      >
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.25,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.contrastText',
              fontWeight: 800,
              bgcolor: 'primary.main',
            }}
          >
            A
          </Box>
          <Box sx={{ mr: 'auto' }}>
            <Typography variant="h6">Acme Dataroom</Typography>
            <Typography variant="body2" color="text.secondary">
              Secure deal rooms for high-stakes diligence
            </Typography>
          </Box>
          <SearchDropdown onSelect={handleSearchSelect} />
          <Chip label="Token active" size="small" />
          <Button onClick={onSignOut}>Sign out</Button>
          <Typography variant="body2" color="text.secondary">
            Trusted for sensitive acquisitions
          </Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreateDataroom}>
            New dataroom
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: { xs: 1.5, md: 2.5 },
          minHeight: { lg: 'calc(100vh - 96px)' },
          display: 'flex',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2.5}
          alignItems="stretch"
          sx={{ flex: 1, minHeight: 0 }}
        >
          <Paper sx={{ width: { xs: '100%', lg: 300 }, p: 1.25, height: '100%' }}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1">Datarooms</Typography>
                <IconButton size="small" onClick={openCreateDataroom}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>

              {dataroomLoading ? <LinearProgress /> : null}
              {dataroomError ? <Alert severity="error">{dataroomError.message}</Alert> : null}

              <List dense disablePadding>
                {datarooms.map((room) => {
                  const isSelected = selectedDataroomId === room.id
                  return (
                    <ListItem key={room.id} disablePadding sx={{ mb: 0.25 }}>
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 0.75 }}>
                        <ListItemButton
                          selected={isSelected}
                          sx={{ minWidth: 0, flex: 1, borderRadius: 1.25 }}
                          onClick={() => {
                            setSelectedDataroomId(room.id)
                            setCurrentFolderId(null)
                            setHighlightFileId(null)
                            setSelectedFile(null)
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <BusinessOutlinedIcon
                              fontSize="small"
                              color={isSelected ? 'primary' : 'inherit'}
                            />
                          </ListItemIcon>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Tooltip title={room.name} placement="top" arrow>
                              <Typography noWrap>{room.name}</Typography>
                            </Tooltip>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {new Date(room.updatedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </ListItemButton>
                        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                          <Tooltip title="Rename dataroom" placement="top" arrow>
                            <IconButton
                              size="small"
                              aria-label={`Rename ${room.name}`}
                              onClick={() => openRenameDataroom(room)}
                            >
                              <DriveFileRenameOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete dataroom" placement="top" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Delete ${room.name}`}
                              onClick={() => openDeleteDataroom(room)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </ListItem>
                  )
                })}
              </List>
            </Stack>
          </Paper>

          <Paper sx={{ flex: 1, p: { xs: 1.25, md: 2 }, height: '100%', minWidth: 0 }}>
            {!activeDataroom ? (
              <Stack
                spacing={2.5}
                sx={{ minHeight: 420, justifyContent: 'center', alignItems: 'center', px: 2, textAlign: 'center' }}
              >
                <BusinessOutlinedIcon color="primary" sx={{ fontSize: 52 }} />
                <Typography variant="h5">Create your first dataroom</Typography>
                <Typography variant="body2" color="text.secondary">
                  Use folders and PDF files to structure due diligence documents.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDataroom}>
                  Create dataroom
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                  <Box>
                    <Typography variant="h5">{activeDataroom.name}</Typography>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
                      <Link
                        component="button"
                        underline="hover"
                        color="inherit"
                        onClick={() => {
                          setCurrentFolderId(null)
                          setHighlightFileId(null)
                        }}
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <HomeOutlinedIcon sx={{ fontSize: 16 }} />
                        Root
                      </Link>
                      {breadcrumb.map((folder) => (
                        <Link
                          key={folder.id}
                          component="button"
                          underline="hover"
                          color="inherit"
                          onClick={() => {
                            setCurrentFolderId(folder.id)
                            setHighlightFileId(null)
                          }}
                        >
                          {folder.name}
                        </Link>
                      ))}
                    </Breadcrumbs>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems={'center'}>
                    <Button variant="text" color="inherit" startIcon={<AddIcon />} onClick={openCreateFolder}>
                      New folder
                    </Button>
                    <Button variant="contained" startIcon={<DriveFolderUploadOutlinedIcon />} onClick={triggerFileDialog}>
                      Upload PDF
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      disabled={selectedBulkKeys.length === 0}
                      onClick={openDeleteSelectedItems}
                    >
                      Delete selected ({selectedBulkKeys.length})
                    </Button>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept="application/pdf"
                      hidden
                      onChange={onUploadInputChange}
                    />
                  </Stack>
                </Stack>

                <Paper
                  variant="outlined"
                  onDrop={onDropFiles}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  sx={{
                    p: 1.5,
                    borderStyle: 'dashed',
                    borderColor: dragActive ? 'primary.main' : 'divider',
                    bgcolor: dragActive ? 'action.selected' : 'background.paper',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Drag and drop PDF files here to upload into this folder.
                  </Typography>
                </Paper>

                {contentsLoading ? <LinearProgress /> : null}
                {contentsError ? <Alert severity="error">{contentsError.message}</Alert> : null}

                {!contentsLoading && !contentsError ? (
                  <Box
                    sx={{
                      minHeight: 0,
                      minWidth: 0,
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: 'minmax(0,1fr)',
                        xl: selectedFile ? 'minmax(0,1fr) minmax(340px,42%)' : 'minmax(0,1fr)',
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <DriveTable
                        items={items}
                        selectedItemKey={selectedItemKey}
                        selectedBulkKeys={selectedBulkKeys}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        filePage={filePage}
                        filePageSize={filePageSize}
                        fileTotal={filesTotal}
                        onSortChange={onSortChange}
                        onToggleItemSelection={onToggleItemSelection}
                        onToggleAllVisibleItems={onToggleAllVisibleItems}
                        onFilePageChange={setFilePage}
                        onFilePageSizeChange={setFilePageSize}
                        onSelect={selectDriveItem}
                        onOpen={openDriveItem}
                        onRename={renameDriveItem}
                        onDelete={deleteDriveItem}
                      />
                    </Box>
                    {selectedFile ? (
                      <Paper variant="outlined" sx={{ width: '100%', p: 2, minHeight: { xs: 460, xl: 620 }, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1">Preview</Typography>
                          <IconButton size="small" onClick={() => setSelectedFile(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Box sx={{ height: 'calc(100% - 32px)' }}>
                          <PdfPreview file={selectedFile} token={token} onDownload={downloadFile} />
                        </Box>
                      </Paper>
                    ) : null}
                  </Box>
                ) : null}
              </Stack>
            )}
          </Paper>
        </Stack>
      </Box>

      {dialog ? (
        <DialogModal
          dialog={dialog}
          value={dialogValue}
          busy={dialogBusy}
          error={dialogError}
          onChange={setDialogValue}
          onClose={closeDialog}
          onConfirm={handleDialogConfirm}
        />
      ) : null}

      <NoticeToast notice={notice} />
    </Box>
  )
}

function App() {
  const { token, setToken, clearToken } = useAuthToken()
  const client = useApolloClient()

  const handleAuth = async (values: AuthCredentials, mode: 'login' | 'register') => {
    if (mode === 'register') {
      await requestRegister(values)
      return
    }
    const authToken = await requestToken(values)
    setToken(authToken)
    try {
      await client.clearStore()
    } catch {
      // ignore cache reset failures
    }
  }

  const handleSignOut = () => {
    clearToken()
    void client.clearStore()
  }

  if (!token) {
    return <AuthGate onSubmit={handleAuth} />
  }

  return <AppShell token={token} onSignOut={handleSignOut} />
}

export default App

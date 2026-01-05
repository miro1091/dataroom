import type { ApiDataroom, ApiFile, ApiFolder } from './types/graphql'
import { BUTTONS } from './constants/ui'
import { AuthGate } from './components/AuthGate'
import { DialogModal } from './components/DialogModal'
import { DataroomView } from './components/DataroomView'
import { SearchDropdown } from './components/SearchDropdown'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAuthToken } from './hooks/useAuthToken'
import { useDataroomState } from './hooks/useDataroomState'
import { requestToken } from './utils/authApi'
import type { AuthCredentials } from './types/auth'

const AppShell = ({ token, onSignOut }: { token: string; onSignOut: () => void }) => {
  const {
    datarooms,
    dataroomLoading,
    dataroomError,
    activeDataroom,
    selectedDataroomId,
    breadcrumb,
    folders,
    files,
    contentsLoading,
    contentsError,
    selectedFile,
    highlightFileId,
    notice,
    dialog,
    dialogValue,
    dialogBusy,
    dialogError,
    setSelectedDataroomId,
    setCurrentFolderId,
    setSelectedFile,
    setHighlightFileId,
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
    handleUpload,
    handleRenameFile,
    handleDeleteFile,
    openFileLocation,
  } = useDataroomState()

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
      onConfirm: handleCreateDataroom,
    })

  const openRenameDataroom = (room: ApiDataroom) =>
    openInputDialog({
      kind: 'input',
      title: 'Rename dataroom',
      label: 'New name',
      confirmLabel: 'Save',
      defaultValue: room.name,
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
      onConfirm: handleCreateFolder,
    })

  const openRenameFolder = (folder: ApiFolder) =>
    openInputDialog({
      kind: 'input',
      title: 'Rename folder',
      label: 'New name',
      confirmLabel: 'Save',
      defaultValue: folder.name,
      onConfirm: (value) => handleRenameFolder(folder, value),
    })

  const openDeleteFolder = (folder: ApiFolder) =>
    openConfirmDialog({
      kind: 'confirm',
      title: 'Delete folder',
      description: 'This deletes all nested folders and files inside it.',
      confirmLabel: 'Delete',
      onConfirm: () => handleDeleteFolder(folder),
    })

  const openRenameFile = (file: ApiFile) =>
    openInputDialog({
      kind: 'input',
      title: 'Rename file',
      label: 'New name',
      confirmLabel: 'Save',
      defaultValue: file.name,
      onConfirm: (value) => handleRenameFile(file, value),
    })

  const openDeleteFile = (file: ApiFile) =>
    openConfirmDialog({
      kind: 'confirm',
      title: 'Delete file',
      description: 'This removes the file from the dataroom.',
      confirmLabel: 'Delete',
      onConfirm: () => handleDeleteFile(file),
    })

  const handleSearchSelect = (item: {
    id: number
    dataroomId: number
    folderId?: number | null
  }) => {
    openFileLocation(item.dataroomId, item.folderId ?? null, item.id)
  }

  const authNode = (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-muted">Token active</span>
      <button className={BUTTONS.ghost} onClick={onSignOut}>
        Sign out
      </button>
    </div>
  )

  return (
    <div className="relative min-h-screen px-4 py-7 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(216,107,77,0.12),transparent_45%)]" />
      <div className="relative z-10 flex flex-col gap-6">
        <Topbar
          notice={notice}
          onCreate={openCreateDataroom}
          search={<SearchDropdown onSelect={handleSearchSelect} />}
          auth={authNode}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
          <Sidebar
            datarooms={datarooms}
            loading={dataroomLoading}
            error={dataroomError?.message}
            selectedId={selectedDataroomId}
            onSelect={(id) => {
              setSelectedDataroomId(id)
              setCurrentFolderId(null)
              setHighlightFileId(null)
            }}
            onCreate={openCreateDataroom}
            onRename={openRenameDataroom}
            onDelete={openDeleteDataroom}
          />

          <main className="min-h-[70vh] rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            {!activeDataroom ? (
              <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-white/70 p-10 text-left text-sm text-muted">
                <h3 className="font-sans text-xl font-semibold text-ink">
                  Create a secure data room
                </h3>
                <p>
                  Organize diligence documents with nested folders, scoped access, and clean previews.
                </p>
                <button className={BUTTONS.primary} onClick={openCreateDataroom}>
                  Start a dataroom
                </button>
              </div>
            ) : (
              <DataroomView
                dataroom={activeDataroom}
                breadcrumb={breadcrumb}
                folders={folders}
                files={files}
                selectedFile={selectedFile}
                highlightFileId={highlightFileId}
                loading={contentsLoading}
                error={contentsError?.message}
                onRoot={() => {
                  setCurrentFolderId(null)
                  setHighlightFileId(null)
                }}
                onNavigateFolder={(id) => {
                  setCurrentFolderId(id)
                  setHighlightFileId(null)
                }}
                onCreateFolder={openCreateFolder}
                onUpload={handleUpload}
                onOpenFolder={(folder) => {
                  setCurrentFolderId(folder.id)
                  setHighlightFileId(null)
                }}
                onRenameFolder={openRenameFolder}
                onDeleteFolder={openDeleteFolder}
                onSelectFile={(file) => {
                  setSelectedFile(file)
                  setHighlightFileId(null)
                  void downloadFile(file)
                }}
                onRenameFile={openRenameFile}
                onDeleteFile={openDeleteFile}
              />
            )}
          </main>
        </div>
      </div>

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
    </div>
  )
}

function App() {
  const { token, setToken, clearToken } = useAuthToken()

  const handleLogin = async (values: AuthCredentials) => {
    const authToken = await requestToken(values)
    setToken(authToken)
  }

  if (!token) {
    return <AuthGate onSubmit={handleLogin} />
  }

  return <AppShell token={token} onSignOut={clearToken} />
}

export default App

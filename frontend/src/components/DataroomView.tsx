import type { ChangeEvent } from 'react'
import type { ApiDataroom, ApiFile, ApiFolder } from '../types/graphql'
import { BUTTONS } from '../constants/ui'
import { Breadcrumbs } from './Breadcrumbs'
import { FolderList } from './FolderList'
import { FileList } from './FileList'

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
}: DataroomViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-semibold text-ink">{dataroom.name}</h2>
          <Breadcrumbs items={breadcrumb} onRoot={onRoot} onNavigate={onNavigateFolder} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className={BUTTONS.outline} onClick={onCreateFolder}>
            New folder
          </button>
          <label className={BUTTONS.primary}>
            Upload PDF
            <input className="hidden" type="file" accept="application/pdf" onChange={onUpload} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
          Loading contents…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
          {error}
        </div>
      ) : (
        <section className="flex flex-col gap-6">
          <div>
            <div className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Folders
            </div>
            <FolderList
              folders={folders}
              onOpen={onOpenFolder}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
            />
          </div>

          <div>
            <div className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Files
            </div>
            <FileList
              files={files}
              selectedFileId={selectedFile?.id ?? null}
              highlightFileId={highlightFileId}
              onSelect={onSelectFile}
              onRename={onRenameFile}
              onDelete={onDeleteFile}
            />
          </div>
        </section>
      )}
    </div>
  )
}

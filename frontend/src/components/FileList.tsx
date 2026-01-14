import type { ApiFile } from '../types/graphql'
import { BUTTONS } from '../constants/ui'
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
    return (
      <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
        Upload your first PDF to share with stakeholders.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => {
        const isActive = selectedFileId === file.id || highlightFileId === file.id
        return (
          <div
            key={file.id}
            className={`grid items-center gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] ${
              isActive ? 'border-accent/40 shadow-md' : 'border-border'
            }`}
          >
            <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => onSelect(file)}>
              <span className="text-lg">📄</span>
              <span
                className="min-w-0 flex-1 truncate font-sans text-sm font-semibold text-ink"
                title={file.name}
              >
                {file.name}
              </span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-ink">
                {formatSize(file.size)}
              </span>
            </button>
            <div className="text-xs text-muted">
              Updated {new Date(file.updatedAt).toLocaleDateString()}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={BUTTONS.ghost} onClick={() => onRename(file)}>
                Rename
              </button>
              <button className={BUTTONS.ghostDanger} onClick={() => onDelete(file)}>
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

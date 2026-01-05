import type { ApiFolder } from '../types/graphql'
import { BUTTONS } from '../constants/ui'

type FolderListProps = {
  folders: ApiFolder[]
  onOpen: (folder: ApiFolder) => void
  onRename: (folder: ApiFolder) => void
  onDelete: (folder: ApiFolder) => void
}

export const FolderList = ({ folders, onOpen, onRename, onDelete }: FolderListProps) => {
  if (folders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
        No folders here yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {folders.map((folder) => (
        <div key={folder.id} className="grid items-center gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <button className="flex items-center gap-3 text-left" onClick={() => onOpen(folder)}>
            <span className="text-lg">📁</span>
            <span className="font-sans text-sm font-semibold text-ink">{folder.name}</span>
          </button>
          <div className="text-xs text-muted">Updated {new Date(folder.updatedAt).toLocaleDateString()}</div>
          <div className="flex flex-wrap gap-2">
            <button className={BUTTONS.ghost} onClick={() => onRename(folder)}>
              Rename
            </button>
            <button className={BUTTONS.ghostDanger} onClick={() => onDelete(folder)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

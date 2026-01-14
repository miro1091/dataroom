import type { ApiDataroom } from '../types/graphql'
import { BUTTONS } from '../constants/ui'

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
    <aside className="flex min-h-[70vh] flex-col gap-4 rounded-xl border border-border bg-paper p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-sans text-lg font-semibold text-ink">Datarooms</h2>
          <span className="text-sm text-muted">{datarooms.length} active rooms</span>
        </div>
        <button className={BUTTONS.icon} onClick={onCreate} aria-label="Create dataroom">
          +
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
          Loading datarooms…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
          {error}
        </div>
      ) : datarooms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-sm text-muted">
          Create your first dataroom to begin.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {datarooms.map((room) => (
            <div
              key={room.id}
              className={`flex items-start justify-between gap-3 rounded-xl border bg-surface p-3 transition ${
                selectedId === room.id
                  ? 'border-accent/40 shadow-md -translate-y-0.5'
                  : 'border-transparent'
              }`}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  onSelect(room.id)
                }}
              >
                <span
                  className="block truncate font-sans text-sm font-semibold text-ink"
                  title={room.name}
                >
                  {room.name}
                </span>
                <span className="block text-xs text-muted">
                  Updated {new Date(room.updatedAt).toLocaleDateString()}
                </span>
              </button>
              <div className="flex flex-col gap-2 text-xs">
                <button className={BUTTONS.ghost} onClick={() => onRename(room)}>
                  Rename
                </button>
                <button className={BUTTONS.ghostDanger} onClick={() => onDelete(room)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

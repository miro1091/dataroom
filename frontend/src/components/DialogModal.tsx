import type { DialogState } from '../types/ui'
import { BUTTONS } from '../constants/ui'

type DialogModalProps = {
  dialog: DialogState
  value: string
  busy: boolean
  error: string
  onChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}

export const DialogModal = ({
  dialog,
  value,
  busy,
  error,
  onChange,
  onClose,
  onConfirm,
}: DialogModalProps) => {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-sans text-base font-semibold text-ink">{dialog.title}</h3>
          <button className={BUTTONS.icon} onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {dialog.kind === 'input' ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2 text-sm text-ink">
              <span>{dialog.label}</span>
              <input
                className="rounded-lg border border-border bg-[#fffaf4] px-3 py-2"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Type a name"
                autoFocus
              />
            </label>
            {error ? <div className="text-xs text-[#a33d2e]">{error}</div> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">{dialog.description}</p>
            {error ? <div className="text-xs text-[#a33d2e]">{error}</div> : null}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button className={BUTTONS.outline} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className={BUTTONS.primary} onClick={onConfirm} disabled={busy}>
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

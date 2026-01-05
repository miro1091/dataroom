import type { ReactNode } from 'react'
import type { Notice } from '../types/ui'
import { BUTTONS } from '../constants/ui'

type TopbarProps = {
  notice: Notice | null
  onCreate: () => void
  search?: ReactNode
  auth?: ReactNode
}

export const Topbar = ({ notice, onCreate, search, auth }: TopbarProps) => {
  const noticeStyles =
    notice?.type === 'error'
      ? 'bg-[rgba(175,63,45,0.12)] text-[#a33d2e]'
      : 'bg-[rgba(216,107,77,0.15)] text-accent-dark'

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[#e7a07c] font-sans text-xl font-bold text-[#fffaf2] shadow-soft">
          A
        </div>
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Acme Dataroom
          </h1>
          <p className="text-sm text-muted sm:text-base">
            Secure deal rooms for high-stakes diligence
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {search ?? null}
        {auth ?? null}
        {notice ? (
          <div className={`rounded-full px-3 py-1.5 text-sm font-medium ${noticeStyles}`}>
            {notice.message}
          </div>
        ) : (
          <span className="text-sm text-muted">Trusted for sensitive acquisitions</span>
        )}
        <button className={BUTTONS.primary} onClick={onCreate}>
          New dataroom
        </button>
      </div>
    </header>
  )
}

import type { Notice } from '../types/ui'

type NoticeToastProps = {
  notice: Notice | null
}

export const NoticeToast = ({ notice }: NoticeToastProps) => {
  if (!notice) return null

  const isError = notice.type === 'error'
  const baseStyles =
    'fixed right-6 top-6 z-50 flex w-[min(90vw,360px)] items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft'
  const themeStyles = isError
    ? 'border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]'
    : 'border-[#86efac] bg-[#f0fdf4] text-[#166534]'
  const dotStyles = isError ? 'bg-[#ef4444]' : 'bg-[#22c55e]'
  const role = isError ? 'alert' : 'status'

  return (
    <div className={`${baseStyles} ${themeStyles}`} role={role} aria-live="polite">
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotStyles}`} />
      <div className="text-sm font-semibold">{notice.message}</div>
    </div>
  )
}

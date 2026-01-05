import type { ApiFolder } from '../types/graphql'

type BreadcrumbsProps = {
  items: ApiFolder[]
  onRoot: () => void
  onNavigate: (id: number) => void
}

export const Breadcrumbs = ({ items, onRoot, onNavigate }: BreadcrumbsProps) => {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <button
        className="rounded-full bg-black/5 px-3 py-1 text-xs text-ink transition hover:bg-accent/15"
        onClick={onRoot}
      >
        Home
      </button>
      {items.map((folder) => (
        <button
          key={folder.id}
          className="rounded-full bg-black/5 px-3 py-1 text-xs text-ink transition hover:bg-accent/15"
          onClick={() => onNavigate(folder.id)}
        >
          {folder.name}
        </button>
      ))}
    </div>
  )
}

import { useApolloClient } from '@apollo/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchFilesDocument } from '../graphql/generated'
import type { SearchFilesQuery } from '../graphql/generated'
import { useOutsideClick } from '../hooks/useOutsideClick'

const PAGE_SIZE = 10

type SearchItem = SearchFilesQuery['searchFiles']['items'][number]

type SearchDropdownProps = {
  onSelect: (item: SearchItem) => void
}

export const SearchDropdown = ({ onSelect }: SearchDropdownProps) => {
  const client = useApolloClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [term, setTerm] = useState('')
  const [items, setItems] = useState<SearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useOutsideClick(containerRef, () => setOpen(false))

  const trimmed = useMemo(() => term.trim(), [term])

  const reset = () => {
    setItems([])
    setTotal(0)
    setHasMore(false)
    setError(null)
  }

  useEffect(() => {
    if (!trimmed) {
      reset()
      return
    }

    setLoading(true)
    setOpen(true)
    const handle = window.setTimeout(async () => {
      try {
        const { data } = await client.query({
          query: SearchFilesDocument,
          variables: { query: trimmed, offset: 0, limit: PAGE_SIZE },
          fetchPolicy: 'network-only',
        })
        setItems(data.searchFiles.items)
        setTotal(data.searchFiles.total)
        setHasMore(data.searchFiles.hasMore)
        setError(null)
      } catch (err) {
        setError('Unable to load search results.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(handle)
  }, [client, trimmed])

  const loadMore = async () => {
    if (loadingMore || loading || !hasMore) return
    setLoadingMore(true)
    try {
      const { data } = await client.query({
        query: SearchFilesDocument,
        variables: { query: trimmed, offset: items.length, limit: PAGE_SIZE },
        fetchPolicy: 'network-only',
      })
      setItems((prev) => [...prev, ...data.searchFiles.items])
      setHasMore(data.searchFiles.hasMore)
      setTotal(data.searchFiles.total)
    } catch (err) {
      setError('Unable to load more results.')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleScroll = () => {
    const node = listRef.current
    if (!node || loadingMore || !hasMore) return
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 40) {
      void loadMore()
    }
  }

  const handleSelect = (item: SearchItem) => {
    onSelect(item)
    setTerm('')
    setOpen(false)
    reset()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm text-muted shadow-sm">
        <span className="text-base">🔎</span>
        <input
          className="w-40 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none sm:w-56"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => {
            if (trimmed) setOpen(true)
          }}
          placeholder="Search files"
        />
      </div>

      {open && trimmed ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-white p-2 shadow-soft">
          <div className="px-2 pb-2 text-xs text-muted">
            {loading
              ? 'Searching…'
              : `${items.length}${total ? ` / ${total}` : ''} results`}
          </div>
          <div
            ref={listRef}
            className="max-h-72 space-y-1 overflow-auto px-1"
            onScroll={handleScroll}
          >
            {error ? (
              <div className="rounded-lg border border-dashed border-border bg-white/70 p-3 text-xs text-muted">
                {error}
              </div>
            ) : null}
            {!loading && items.length === 0 && !error ? (
              <div className="rounded-lg border border-dashed border-border bg-white/70 p-3 text-xs text-muted">
                No files match "{trimmed}".
              </div>
            ) : null}
            {items.map((item) => (
              <button
                key={item.id}
                className="w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm text-ink transition hover:border-border hover:bg-accent/10"
                onMouseDown={() => handleSelect(item)}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-sans text-sm font-semibold" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {item.dataroomName}
                  {item.folderName ? ` / ${item.folderName}` : ''}
                </div>
              </button>
            ))}
            {loadingMore ? (
              <div className="px-2 py-2 text-xs text-muted">Loading more…</div>
            ) : null}
            {!hasMore && items.length > 0 ? (
              <div className="px-2 py-2 text-center text-xs text-muted">End of results</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

import { Breadcrumbs as MuiBreadcrumbs, Link } from '@mui/material'
import type { ApiFolder } from '../types/graphql'

type BreadcrumbsProps = {
  items: ApiFolder[]
  onRoot: () => void
  onNavigate: (id: number) => void
}

export const Breadcrumbs = ({ items, onRoot, onNavigate }: BreadcrumbsProps) => {
  return (
    <MuiBreadcrumbs aria-label="breadcrumb navigation" sx={{ mt: 0.5 }}>
      <Link component="button" underline="hover" color="inherit" onClick={onRoot}>
        Home
      </Link>
      {items.map((folder) => (
        <Link
          key={folder.id}
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => onNavigate(folder.id)}
        >
          {folder.name}
        </Link>
      ))}
    </MuiBreadcrumbs>
  )
}

import { Alert, Snackbar } from '@mui/material'
import type { Notice } from '../types/ui'

type NoticeToastProps = {
  notice: Notice | null
}

export const NoticeToast = ({ notice }: NoticeToastProps) => {
  if (!notice) return null
  return (
    <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert severity={notice.type === 'error' ? 'error' : 'success'} variant="filled" sx={{ width: '100%' }}>
        {notice.message}
      </Alert>
    </Snackbar>
  )
}

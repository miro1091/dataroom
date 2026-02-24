import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import type { DialogState } from '../types/ui'

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
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{dialog.title}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {dialog.kind === 'input' ? (
          <TextField
            autoFocus
            margin="dense"
            label={dialog.label}
            fullWidth
            size="small"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            inputProps={{ maxLength: dialog.maxLength }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {dialog.description}
          </Typography>
        )}
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={busy}>
          {dialog.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type TopbarProps = {
  onCreate: () => void
  search?: ReactNode
  auth?: ReactNode
}

export const Topbar = ({ onCreate, search, auth }: TopbarProps) => {
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between">
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ width: 48, height: 48, fontWeight: 700 }}>A</Avatar>
        <Box>
          <Typography variant="h4">Acme Dataroom</Typography>
          <Typography variant="body2" color="text.secondary">
            Secure deal rooms for high-stakes diligence
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        {search ?? null}
        {auth ?? null}
        <Typography variant="body2" color="text.secondary">
          Trusted for sensitive acquisitions
        </Typography>
        <Button variant="contained" onClick={onCreate}>
          New dataroom
        </Button>
      </Stack>
    </Stack>
  )
}

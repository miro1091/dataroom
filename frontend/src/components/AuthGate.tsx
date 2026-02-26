import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { type SyntheticEvent, useMemo, useState } from 'react'
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'

import type { AuthCredentials } from '../types/auth'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(6, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof registerSchema>

type AuthGateProps = {
  onSubmit: (values: AuthCredentials, mode: 'login' | 'register') => Promise<void>
}

export const AuthGate = ({ onSubmit }: AuthGateProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const schema = useMemo(() => (mode === 'register' ? registerSchema : loginSchema), [mode])
  const resolver: Resolver<FormValues> = async (values) => {
    const result = schema.safeParse(values)
    if (result.success) {
      const fullValues: FormValues = {
        username: values.username ?? '',
        password: values.password ?? '',
        confirmPassword: values.confirmPassword ?? '',
      }
      return { values: fullValues, errors: {} }
    }

    const errors: FieldErrors<FormValues> = {}
    const fieldErrors = result.error.flatten().fieldErrors
    ;(Object.entries(fieldErrors) as Array<[keyof FormValues, string[] | undefined]>).forEach(
      ([key, messages]) => {
        if (messages?.[0]) {
          errors[key] = { type: 'validation', message: messages[0] }
        }
      },
    )
    return { values: {}, errors }
  }

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: { username: '', password: '', confirmPassword: '' },
  })

  const submit = handleSubmit(async (values) => {
    setSuccessMessage('')
    setLoading(true)
    try {
      await onSubmit({ username: values.username, password: values.password }, mode)
      if (mode === 'register') {
        setSuccessMessage('Registration successful. You can log in now.')
        setMode('login')
        reset({ username: values.username, password: '', confirmPassword: '' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.'
      const normalized = message.toLowerCase()
      const handled =
        mode === 'register' &&
        (normalized.includes('username') || normalized.includes('password')) &&
        (() => {
          if (normalized.includes('username')) {
            setError('username', { message })
            return true
          }
          if (normalized.includes('password')) {
            setError('password', { message })
            return true
          }
          return false
        })()

      if (!handled) {
        setError('root', { message })
      }
    } finally {
      setLoading(false)
    }
  })

  const switchMode = (_: SyntheticEvent, nextValue: 'login' | 'register') => {
    if (!nextValue || nextValue === mode) return
    setMode(nextValue)
    setSuccessMessage('')
    reset({ username: '', password: '', confirmPassword: '' })
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 3,
      }}
    >
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 420, p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Acme Dataroom
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Secure document workspace for diligence teams.
        </Typography>

        <Tabs value={mode} onChange={switchMode} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab value="login" label="Log in" />
          <Tab value="register" label="Sign up" />
        </Tabs>

        <Stack component="form" spacing={2} onSubmit={submit}>
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
          {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}

          <TextField
            label="Username"
            placeholder="acme"
            size="small"
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
            {...register('username')}
          />

          <TextField
            label="Password"
            placeholder="••••••••"
            type="password"
            size="small"
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register('password')}
          />

          {mode === 'register' ? (
            <TextField
              label="Confirm password"
              placeholder="••••••••"
              type="password"
              size="small"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          ) : null}

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}

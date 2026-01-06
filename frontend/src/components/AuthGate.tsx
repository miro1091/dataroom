import { useMemo, useState } from 'react'
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form'
import { z } from 'zod'

import { BUTTONS } from '../constants/ui'
import type { AuthCredentials } from '../types/auth'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, 'Confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
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

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setSuccessMessage('')
    reset({ username: '', password: '', confirmPassword: '' })
  }

  const switchMode = (nextMode: 'login' | 'register') => {
    if (nextMode === mode) return
    setMode(nextMode)
    setSuccessMessage('')
    reset({ username: '', password: '', confirmPassword: '' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
        <div className="flex rounded-full bg-[#f4efe9] p-1 text-xs font-medium text-muted">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-full px-3 py-2 ${
              mode === 'login' ? 'bg-white text-ink shadow-soft' : 'text-muted'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 rounded-full px-3 py-2 ${
              mode === 'register' ? 'bg-white text-ink shadow-soft' : 'text-muted'
            }`}
          >
            Sign up
          </button>
        </div>

        <h1 className="font-sans text-2xl font-semibold text-ink">
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'login'
            ? 'Use your credentials to access this dataroom workspace.'
            : 'Create your account to access this dataroom workspace.'}
        </p>
        {successMessage ? (
          <div className="mt-4 rounded-lg border border-[#b7e1c1] bg-[#e9f8ef] px-3 py-2 text-sm text-[#1f6d3a]">
            {successMessage}
          </div>
        ) : null}
        <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
          <label className="flex flex-col gap-2 text-sm text-ink">
            <span>Username</span>
            <input
              className="rounded-lg border border-border bg-[#fffaf4] px-3 py-2 text-sm"
              placeholder="acme"
              {...register('username')}
            />
            {errors.username ? (
              <span className="text-xs text-[#a33d2e]">{errors.username.message}</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-ink">
            <span>Password</span>
            <input
              className="rounded-lg border border-border bg-[#fffaf4] px-3 py-2 text-sm"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password ? (
              <span className="text-xs text-[#a33d2e]">{errors.password.message}</span>
            ) : null}
          </label>

          {mode === 'register' ? (
            <label className="flex flex-col gap-2 text-sm text-ink">
              <span>Confirm password</span>
              <input
                className="rounded-lg border border-border bg-[#fffaf4] px-3 py-2 text-sm"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <span className="text-xs text-[#a33d2e]">{errors.confirmPassword.message}</span>
              ) : null}
            </label>
          ) : null}

          {errors.root ? (
            <span className="text-xs text-[#a33d2e]">{errors.root.message}</span>
          ) : null}

          <button className={BUTTONS.primary} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button className="mt-4 text-sm text-muted underline" onClick={toggleMode} type="button">
          {mode === 'login' ? "No account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { BUTTONS } from '../constants/ui'
import type { AuthCredentials } from '../types/auth'

const schema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

type FormValues = z.infer<typeof schema>

type AuthGateProps = {
  onSubmit: (values: AuthCredentials) => Promise<void>
}

export const AuthGate = ({ onSubmit }: AuthGateProps) => {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setLoading(true)
    try {
      await onSubmit(values)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.'
      setError('root', { message })
    } finally {
      setLoading(false)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/90 p-6 shadow-soft">
        <h1 className="font-sans text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Use your issued credentials to access this dataroom workspace.
        </p>
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

          {errors.root ? (
            <span className="text-xs text-[#a33d2e]">{errors.root.message}</span>
          ) : null}

          <button className={BUTTONS.primary} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

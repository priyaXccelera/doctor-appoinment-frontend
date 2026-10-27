import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner, Field } from '../components/ui'
import { DEMO_PASSWORD_HINT } from '../constants'
import { currentRole, homePathForRole, login } from '../auth/auth'
import { errorMessage } from '../utils/errors'
import { validateRequired } from '../validation'
import { AuthShell } from './AuthShell'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // MOCK: prefilled with the demo patient login — remove before wiring a real backend.
  const [identifier, setIdentifier] = useState('patient1@mail.com')
  // MOCK: prefilled with the demo password — remove before wiring a real backend.
  const [password, setPassword] = useState(DEMO_PASSWORD_HINT)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const identifierError = validateRequired(identifier, 'Email or mobile')
  const passwordError = validateRequired(password, 'Password')
  const isValid = !identifierError && !passwordError

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) return
    setLoading(true)
    setError('')
    try {
      const ok = await login(identifier, password)
      if (!ok) {
        setError('Invalid email/mobile or password')
        return
      }
      const returnTo = searchParams.get('returnTo')
      navigate(returnTo && returnTo.startsWith('/') ? returnTo : homePathForRole(currentRole()), { replace: true })
    } catch (caught) {
      setError(errorMessage(caught, 'Unable to sign in'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to book and manage your appointments.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email or mobile" error={submitted ? identifierError : ''}>
          {(props) => <input {...props} className="input" value={identifier} autoComplete="username" onChange={(event) => setIdentifier(event.target.value)} />}
        </Field>
        <Field label="Password" error={submitted ? passwordError : ''}>
          {(props) => <input {...props} type="password" className="input" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />}
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-primary-text">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading || !isValid}>
          {loading && <Spinner />} Log in
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-primary-text">
          Create an account
        </Link>
      </p>
      <p className="mt-3 rounded-lg bg-primary-soft p-3 text-xs text-muted">
        Demo accounts: admin@clinic.com, doctor1@clinic.com, patient1@mail.com. Password: {DEMO_PASSWORD_HINT}
      </p>
    </AuthShell>
  )
}

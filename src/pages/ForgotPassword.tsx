import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Field, Spinner } from '../components/ui'
import { forgotPassword } from '../auth/auth'
import { errorMessage } from '../utils/errors'
import { validateRequired } from '../validation'
import { AuthShell } from './AuthShell'

export function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const validation = validateRequired(identifier, 'Email or mobile')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (validation) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword(identifier.trim())
      setSent(true)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email or mobile and we will send reset instructions.">
      {sent ? (
        <p role="status" className="rounded-lg bg-success-soft p-3 text-sm text-success">
          If an account exists for {identifier}, reset instructions are on their way.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Email or mobile" error={submitted ? validation : ''}>
            {(props) => <input {...props} className="input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />}
          </Field>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading || !!validation}>
            {loading && <Spinner />} Send reset link
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="font-semibold text-primary-text">
          Back to login
        </Link>
      </p>
    </AuthShell>
  )
}

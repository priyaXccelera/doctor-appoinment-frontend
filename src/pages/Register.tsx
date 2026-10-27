import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Field, Spinner, fieldErrorsFrom } from '../components/ui'
import { signup } from '../auth/auth'
import type { Role } from '../types'
import { errorMessage } from '../utils/errors'
import { validateEmail, validateMobile, validatePassword, validateRequired } from '../validation'
import { AuthShell } from './AuthShell'

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', role: 'PATIENT' as Role, terms: false })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const errors = {
    name: validateRequired(form.name, 'Name'),
    email: validateEmail(form.email),
    mobile: validateMobile(form.mobile),
    password: validatePassword(form.password),
    terms: form.terms ? '' : 'You must accept the terms',
  }
  const isValid = Object.values(errors).every((item) => !item)
  const show = (key: keyof typeof errors) => (submitted ? errors[key] || serverErrors[key] || '' : serverErrors[key] || '')
  const set = (key: string, value: string | boolean) => setForm((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) return
    setLoading(true)
    setError('')
    setServerErrors({})
    try {
      await signup({ name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim(), password: form.password, role: form.role })
      toast.success('Account created')
      navigate(form.role === 'DOCTOR' ? '/doctor/profile' : '/', { replace: true })
    } catch (caught) {
      setServerErrors(fieldErrorsFrom(caught))
      setError(errorMessage(caught, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join MediBook as a patient or a doctor.">
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <Field label="Full name" error={show('name')}>
          {(props) => <input {...props} className="input" value={form.name} onChange={(event) => set('name', event.target.value)} />}
        </Field>
        <Field label="Email" error={show('email')}>
          {(props) => <input {...props} type="email" className="input" value={form.email} onChange={(event) => set('email', event.target.value)} />}
        </Field>
        <Field label="Mobile" error={show('mobile')} hint="10-digit Indian mobile number">
          {(props) => <input {...props} inputMode="numeric" maxLength={10} className="input" value={form.mobile} onChange={(event) => set('mobile', event.target.value)} />}
        </Field>
        <Field label="Password" error={show('password')} hint="At least 8 characters, including a number">
          {(props) => <input {...props} type="password" className="input" autoComplete="new-password" value={form.password} onChange={(event) => set('password', event.target.value)} />}
        </Field>
        <Field label="I am a">
          {(props) => (
            <select {...props} className="input" value={form.role} onChange={(event) => set('role', event.target.value)}>
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
            </select>
          )}
        </Field>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.terms} onChange={(event) => set('terms', event.target.checked)} className="accent-primary" />
            I accept the terms and privacy policy
          </label>
          {show('terms') && <p role="alert" className="mt-1 text-xs text-danger">{show('terms')}</p>}
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading || !isValid}>
          {loading && <Spinner />} Create account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-primary-text">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

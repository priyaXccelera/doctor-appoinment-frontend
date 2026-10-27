import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Avatar, ErrorState, Field, PageHeader, Skeleton, Spinner, Toggle, fieldErrorsFrom } from '../components/ui'
import { changePassword } from '../auth/auth'
import { getProfile, updateProfile } from '../data/store'
import { useAsync, useDocumentMeta, useUnsavedWarning } from '../hooks'
import { errorMessage } from '../utils/errors'
import { validateEmail, validateMobile, validatePassword, validateRequired } from '../validation'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi']

export function PatientProfile() {
  useDocumentMeta('Profile & account settings')
  const { data, loading, error, reload } = useAsync(getProfile)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', photoUrl: '', language: 'English', shareRecords: true, showProfile: false })
  const [dirty, setDirty] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [pwSubmitted, setPwSubmitted] = useState(false)
  const [pwError, setPwError] = useState('')
  useUnsavedWarning(dirty)

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        photoUrl: data.photoUrl ?? '',
        language: data.language ?? 'English',
        shareRecords: data.privacy?.shareRecords ?? true,
        showProfile: data.privacy?.showProfile ?? false,
      })
    }
  }, [data])

  const errors = { name: validateRequired(form.name, 'Name'), email: validateEmail(form.email), mobile: validateMobile(form.mobile) }
  const isValid = !errors.name && !errors.email && !errors.mobile
  const change = (changes: Partial<typeof form>) => {
    setForm({ ...form, ...changes })
    setDirty(true)
  }

  const handlePhoto = (file: File | undefined) => {
    if (!file) return
    if (file.size > 500 * 1024) {
      toast.error('Photo must be 500 KB or smaller')
      return
    }
    const reader = new FileReader()
    reader.onload = () => change({ photoUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid) return
    setSaving(true)
    setServerErrors({})
    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        photoUrl: form.photoUrl,
        language: form.language,
        privacy: { shareRecords: form.shareRecords, showProfile: form.showProfile },
      })
      setDirty(false)
      toast.success('Profile updated')
      reload()
    } catch (caught) {
      setServerErrors(fieldErrorsFrom(caught))
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    setPwSubmitted(true)
    setPwError('')
    if (!passwords.current || validatePassword(passwords.next)) return
    try {
      await changePassword(passwords.current, passwords.next)
      toast.success('Password changed')
      setPasswords({ current: '', next: '' })
      setPwSubmitted(false)
    } catch (caught) {
      setPwError(errorMessage(caught))
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile & account settings" />
      <form onSubmit={save} noValidate className="card space-y-4 p-5">
        <h2 className="font-bold">Personal details</h2>
        <div className="flex items-center gap-4">
          <Avatar src={form.photoUrl} name={form.name || 'User'} size={72} />
          <Field label="Photo" hint="PNG or JPG, up to 500 KB">
            {(props) => <input {...props} type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0])} className="text-sm" />}
          </Field>
        </div>
        <Field label="Full name" error={submitted ? errors.name || serverErrors.name : serverErrors.name}>
          {(props) => <input {...props} className="input" value={form.name} onChange={(event) => change({ name: event.target.value })} />}
        </Field>
        <Field label="Email" error={submitted ? errors.email || serverErrors.email : serverErrors.email}>
          {(props) => <input {...props} type="email" className="input" value={form.email} onChange={(event) => change({ email: event.target.value })} />}
        </Field>
        <Field label="Mobile" error={submitted ? errors.mobile || serverErrors.mobile : serverErrors.mobile} hint="10-digit Indian mobile number">
          {(props) => <input {...props} className="input" maxLength={10} value={form.mobile} onChange={(event) => change({ mobile: event.target.value })} />}
        </Field>
        <Field label="Language">
          {(props) => (
            <select {...props} className="input" value={form.language} onChange={(event) => change({ language: event.target.value })}>
              {LANGUAGES.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}
        </Field>
        <h2 className="pt-2 font-bold">Privacy</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Share my medical records with doctors I book</span>
          <Toggle label="Share medical records" checked={form.shareRecords} onChange={(value) => change({ shareRecords: value })} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Show my name on reviews</span>
          <Toggle label="Show name on reviews" checked={form.showProfile} onChange={(value) => change({ showProfile: value })} />
        </div>
        <p className="text-sm"><Link to="/notification-preferences" className="font-semibold text-primary-text">Manage notification preferences</Link></p>
        <button type="submit" className="btn-primary" disabled={saving || !dirty}>{saving && <Spinner />} Save changes</button>
      </form>

      <form onSubmit={submitPassword} noValidate className="card space-y-4 p-5">
        <h2 className="font-bold">Change password</h2>
        <Field label="Current password" error={pwSubmitted && !passwords.current ? 'Current password is required' : ''}>
          {(props) => <input {...props} type="password" className="input" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} />}
        </Field>
        <Field label="New password" error={pwSubmitted ? validatePassword(passwords.next) : ''} hint="At least 8 characters, including a number">
          {(props) => <input {...props} type="password" className="input" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} />}
        </Field>
        {pwError && <p role="alert" className="text-sm text-danger">{pwError}</p>}
        <button type="submit" className="btn-outline">Update password</button>
      </form>
    </div>
  )
}

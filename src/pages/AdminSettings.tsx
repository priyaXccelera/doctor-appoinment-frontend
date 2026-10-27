import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ErrorState, Field, PageHeader, Skeleton, Spinner } from '../components/ui'
import { saveSettings } from '../data/adminStore'
import { getSettings } from '../data/store'
import { useAsync, useDocumentMeta, useUnsavedWarning } from '../hooks'
import type { PlatformSettings } from '../types'
import { errorMessage } from '../utils/errors'

const FIELDS: { key: keyof PlatformSettings; label: string; hint: string; min: number; max: number }[] = [
  { key: 'commissionPercent', label: 'Commission (%)', hint: 'Platform commission per paid appointment (0-50)', min: 0, max: 50 },
  { key: 'cancellationWindowHours', label: 'Cancellation window (hours)', hint: 'Free cancellation before this many hours (0-168)', min: 0, max: 168 },
  { key: 'refundPercent', label: 'Late-cancellation refund (%)', hint: 'Refund inside the window (0-100)', min: 0, max: 100 },
  { key: 'holdMinutes', label: 'Slot hold duration (minutes)', hint: '1-30 minutes', min: 1, max: 30 },
  { key: 'leadTimeHours', label: 'Booking lead time (hours)', hint: 'Minimum time before a slot can be booked (0-72)', min: 0, max: 72 },
]

export function AdminSettings() {
  useDocumentMeta('Platform settings')
  const { data, loading, error, reload } = useAsync(getSettings)
  const [form, setForm] = useState<PlatformSettings | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  useUnsavedWarning(dirty)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (loading || !form) return error ? <ErrorState message={error} onRetry={reload} /> : <Skeleton className="h-80 w-full" />

  const errorFor = (field: (typeof FIELDS)[number]) => {
    const value = form[field.key]
    return Number.isNaN(value) || value < field.min || value > field.max ? `Enter a value between ${field.min} and ${field.max}` : ''
  }
  const isValid = FIELDS.every((field) => !errorFor(field))

  const save = async () => {
    setSubmitted(true)
    if (!isValid) return
    setSaving(true)
    try {
      await saveSettings(form)
      setDirty(false)
      toast.success('Settings saved')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Platform settings" />
      <form onSubmit={(event) => { event.preventDefault(); save() }} noValidate className="card space-y-4 p-5">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} hint={field.hint} error={submitted ? errorFor(field) : ''}>
            {(props) => <input {...props} type="number" className="input" value={Number.isNaN(form[field.key]) ? '' : form[field.key]} onChange={(event) => { setForm({ ...form, [field.key]: event.target.value === '' ? NaN : Number(event.target.value) }); setDirty(true) }} />}
          </Field>
        ))}
        <button type="submit" className="btn-primary" disabled={saving || !dirty}>{saving && <Spinner />} Save settings</button>
      </form>
    </div>
  )
}

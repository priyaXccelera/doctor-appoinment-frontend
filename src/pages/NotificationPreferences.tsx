import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ErrorState, PageHeader, Skeleton, Spinner, Toggle } from '../components/ui'
import { getNotificationPrefs, saveNotificationPrefs } from '../data/store'
import { useAsync, useDocumentMeta, useUnsavedWarning } from '../hooks'
import type { NotificationPrefs } from '../types'

const TYPES: [string, string][] = [
  ['reminders', 'Appointment reminders'],
  ['promotional', 'Promotional offers'],
  ['reviews', 'Review requests'],
  ['prescriptions', 'Prescriptions'],
  ['payments', 'Payments and refunds'],
]

export function NotificationPreferences() {
  useDocumentMeta('Notification preferences')
  const { data, loading, error, reload } = useAsync(getNotificationPrefs)
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  useUnsavedWarning(dirty)

  useEffect(() => {
    if (data) setPrefs(data)
  }, [data])

  const save = async () => {
    if (!prefs) return
    setSaving(true)
    try {
      await saveNotificationPrefs(prefs)
      setDirty(false)
      toast.success('Preferences saved')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !prefs) return error ? <ErrorState message={error} onRetry={reload} /> : <Skeleton className="h-64 w-full" />

  return (
    <div className="max-w-2xl">
      <PageHeader title="Notification preferences" />
      <section className="card mb-4 divide-y divide-line">
        <h2 className="p-4 font-bold">Notify me about</h2>
        {TYPES.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between p-4">
            <span className="text-sm">{label}</span>
            <Toggle label={label} checked={Boolean(prefs.types[key])} onChange={(value) => { setPrefs({ ...prefs, types: { ...prefs.types, [key]: value } }); setDirty(true) }} />
          </div>
        ))}
      </section>
      <section className="card mb-4 divide-y divide-line">
        <h2 className="p-4 font-bold">Channels</h2>
        {(['email', 'sms', 'push'] as const).map((channel) => (
          <div key={channel} className="flex items-center justify-between p-4">
            <span className="text-sm uppercase">{channel}</span>
            <Toggle label={`${channel} notifications`} checked={prefs.channels[channel]} onChange={(value) => { setPrefs({ ...prefs, channels: { ...prefs.channels, [channel]: value } }); setDirty(true) }} />
          </div>
        ))}
      </section>
      <button type="button" className="btn-primary" disabled={saving || !dirty} onClick={save}>{saving && <Spinner />} Save preferences</button>
    </div>
  )
}

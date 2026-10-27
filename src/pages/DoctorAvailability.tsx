import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog, ErrorState, Field, PageHeader, Skeleton, Spinner, Toggle } from '../components/ui'
import { addLeave, addOverride, countLeaveConflicts, deleteLeave, deleteOverride, getAvailability, getDoctorProfile, saveWeeklySchedule } from '../data/doctorStore'
import { useAsync, useDocumentMeta, useUnsavedWarning } from '../hooks'
import type { Availability, DaySchedule, Leave, Mode, Override } from '../types'
import { errorMessage } from '../utils/errors'
import { formatDate, formatTime, todayISO } from '../utils/format'
import { generateDaySlots, toMinutes } from '../utils/slots'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function DoctorAvailability() {
  useDocumentMeta('Availability')
  const { data, loading, error, reload } = useAsync(getAvailability)
  const profile = useAsync(getDoctorProfile)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [activeDay, setActiveDay] = useState(1)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ fromDate: todayISO(), toDate: todayISO(), reason: '' })
  const [leaveSubmitted, setLeaveSubmitted] = useState(false)
  const [conflictPrompt, setConflictPrompt] = useState<number | null>(null)
  const [leaveToDelete, setLeaveToDelete] = useState<Leave | null>(null)
  const [override, setOverride] = useState({ date: todayISO(), closed: false, start: '10:00', end: '14:00' })
  const [timeError, setTimeError] = useState('')
  useUnsavedWarning(dirty)

  useEffect(() => {
    if (data) setAvailability(data)
  }, [data])

  if (loading || !availability) return error ? <ErrorState message={error} onRetry={reload} /> : <Skeleton className="h-96 w-full" />

  const day = availability.weekly.find((item) => item.day === activeDay) as DaySchedule
  const clinics = profile.data?.clinics ?? []

  const updateDay = (changes: Partial<DaySchedule>) => {
    setAvailability({ ...availability, weekly: availability.weekly.map((item) => (item.day === activeDay ? { ...item, ...changes } : item)) })
    setDirty(true)
  }

  const preview = day.enabled ? generateDaySlots(day) : []

  const save = async () => {
    const invalid = availability.weekly.some((item) => item.enabled && item.ranges.some((range) => toMinutes(range.end) <= toMinutes(range.start)))
    if (invalid) {
      setTimeError('Each time range must end after it starts.')
      return
    }
    setTimeError('')
    setSaving(true)
    try {
      await saveWeeklySchedule(availability.weekly)
      setDirty(false)
      toast.success('Schedule saved')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const leaveError = !leaveForm.reason.trim() ? 'Reason is required' : leaveForm.toDate < leaveForm.fromDate ? 'End date must be on or after start date' : ''
  const submitLeave = async (force = false) => {
    setLeaveSubmitted(true)
    if (leaveError) return
    const conflicts = countLeaveConflicts(leaveForm)
    if (conflicts > 0 && !force) {
      setConflictPrompt(conflicts)
      return
    }
    setConflictPrompt(null)
    const updated = await addLeave({ ...leaveForm, reason: leaveForm.reason.trim() })
    setAvailability({ ...availability, leaves: updated.leaves })
    setLeaveForm({ fromDate: todayISO(), toDate: todayISO(), reason: '' })
    setLeaveSubmitted(false)
    toast.success('Leave added')
  }

  const submitOverride = async () => {
    if (!override.closed && toMinutes(override.end) <= toMinutes(override.start)) {
      toast.error('Override end time must be after start time')
      return
    }
    const updated = await addOverride({ date: override.date, closed: override.closed, ranges: override.closed ? [] : [{ start: override.start, end: override.end }] })
    setAvailability({ ...availability, overrides: updated.overrides })
    toast.success('Override saved')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Availability" subtitle="Slots are generated from this weekly schedule." actions={<button type="button" className="btn-primary" disabled={saving || !dirty} onClick={save}>{saving && <Spinner />} Save schedule</button>} />
      {timeError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{timeError}</p>}

      <section className="card p-5">
        <div role="tablist" className="mb-4 flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 0].map((index) => (
            <button key={index} type="button" role="tab" aria-selected={activeDay === index} onClick={() => setActiveDay(index)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${activeDay === index ? 'bg-primary text-white' : 'bg-primary-soft text-primary-text'}`}>
              {DAY_NAMES[index].slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="mb-4 flex items-center gap-3">
          <Toggle label={`${DAY_NAMES[activeDay]} enabled`} checked={day.enabled} onChange={(value) => updateDay({ enabled: value })} />
          <span className="font-semibold">{DAY_NAMES[activeDay]} {day.enabled ? 'is a working day' : 'is off'}</span>
        </div>
        {day.enabled && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Working hours</h3>
              {day.ranges.map((range, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Field label="From">{(props) => <input {...props} type="time" className="input" value={range.start} onChange={(event) => updateDay({ ranges: day.ranges.map((item, position) => (position === index ? { ...item, start: event.target.value } : item)) })} />}</Field>
                  <Field label="To">{(props) => <input {...props} type="time" className="input" value={range.end} onChange={(event) => updateDay({ ranges: day.ranges.map((item, position) => (position === index ? { ...item, end: event.target.value } : item)) })} />}</Field>
                  <button type="button" className="btn-danger mb-5" aria-label="Remove time range" onClick={() => updateDay({ ranges: day.ranges.filter((_, position) => position !== index) })}><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn-outline" onClick={() => updateDay({ ranges: [...day.ranges, { start: '14:00', end: '15:00' }] })}><Plus size={14} /> Add time range</button>
              <h3 className="pt-2 text-sm font-semibold">Breaks</h3>
              {day.breaks.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Field label="From">{(props) => <input {...props} type="time" className="input" value={item.start} onChange={(event) => updateDay({ breaks: day.breaks.map((entry, position) => (position === index ? { ...entry, start: event.target.value } : entry)) })} />}</Field>
                  <Field label="To">{(props) => <input {...props} type="time" className="input" value={item.end} onChange={(event) => updateDay({ breaks: day.breaks.map((entry, position) => (position === index ? { ...entry, end: event.target.value } : entry)) })} />}</Field>
                  <button type="button" className="btn-danger mb-5" aria-label="Remove break" onClick={() => updateDay({ breaks: day.breaks.filter((_, position) => position !== index) })}><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn-outline" onClick={() => updateDay({ breaks: [...day.breaks, { start: '13:00', end: '13:30' }] })}><Plus size={14} /> Add break</button>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Field label="Slot duration (min)">{(props) => <input {...props} type="number" min={5} step={5} className="input" value={day.slotMinutes} onChange={(event) => updateDay({ slotMinutes: Math.max(5, Number(event.target.value)) })} />}</Field>
                <Field label="Buffer (min)">{(props) => <input {...props} type="number" min={0} step={5} className="input" value={day.buffer} onChange={(event) => updateDay({ buffer: Math.max(0, Number(event.target.value)) })} />}</Field>
                <Field label="Mode">
                  {(props) => (
                    <select {...props} className="input" value={day.mode} onChange={(event) => updateDay({ mode: event.target.value as Mode | 'BOTH' })}>
                      <option value="BOTH">Clinic and video</option>
                      <option value="CLINIC">Clinic only</option>
                      <option value="VIDEO">Video only</option>
                    </select>
                  )}
                </Field>
                <Field label="Clinic">
                  {(props) => (
                    <select {...props} className="input" value={day.clinicId} onChange={(event) => updateDay({ clinicId: event.target.value })}>
                      {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
                      {clinics.length === 0 && <option value="">No clinics yet</option>}
                    </select>
                  )}
                </Field>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Live preview ({preview.length} slots)</h3>
              <div className="flex max-h-80 flex-wrap gap-1.5 overflow-y-auto">
                {preview.length === 0 && <p className="text-sm text-muted">No slots are generated for this configuration.</p>}
                {preview.map((slot) => <span key={slot.startTime} className="rounded-md bg-primary-soft px-2 py-1 text-xs font-medium text-primary-text">{formatTime(slot.startTime)}</span>)}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Leaves</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="From">{(props) => <input {...props} type="date" className="input" value={leaveForm.fromDate} onChange={(event) => setLeaveForm({ ...leaveForm, fromDate: event.target.value })} />}</Field>
          <Field label="To">{(props) => <input {...props} type="date" className="input" value={leaveForm.toDate} onChange={(event) => setLeaveForm({ ...leaveForm, toDate: event.target.value })} />}</Field>
          <Field label="Reason" error={leaveSubmitted ? leaveError : ''}>{(props) => <input {...props} className="input" value={leaveForm.reason} onChange={(event) => setLeaveForm({ ...leaveForm, reason: event.target.value })} />}</Field>
          <div className="pt-6"><button type="button" className="btn-primary w-full" onClick={() => submitLeave()}>Add leave</button></div>
        </div>
        {conflictPrompt !== null && (
          <div role="alert" className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
            {conflictPrompt} existing appointment(s) fall within these dates. They will not be cancelled automatically - please reschedule or cancel them.
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-primary" onClick={() => submitLeave(true)}>Add leave anyway</button>
              <button type="button" className="btn-ghost" onClick={() => setConflictPrompt(null)}>Cancel</button>
            </div>
          </div>
        )}
        {availability.leaves.length === 0 && <p className="text-sm text-muted">No leaves scheduled.</p>}
        <ul className="divide-y divide-line">
          {availability.leaves.map((leave) => (
            <li key={leave.id} className="flex items-center justify-between py-2 text-sm">
              <span>{formatDate(leave.fromDate)} - {formatDate(leave.toDate)} · {leave.reason}</span>
              <button type="button" className="btn-danger" aria-label="Delete leave" onClick={() => setLeaveToDelete(leave)}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Date-specific overrides</h2>
        <div className="grid items-end gap-3 sm:grid-cols-5">
          <Field label="Date">{(props) => <input {...props} type="date" className="input" value={override.date} onChange={(event) => setOverride({ ...override, date: event.target.value })} />}</Field>
          <label className="flex items-center gap-2 pb-5 text-sm"><input type="checkbox" className="accent-primary" checked={override.closed} onChange={(event) => setOverride({ ...override, closed: event.target.checked })} /> Closed all day</label>
          <Field label="From">{(props) => <input {...props} type="time" disabled={override.closed} className="input" value={override.start} onChange={(event) => setOverride({ ...override, start: event.target.value })} />}</Field>
          <Field label="To">{(props) => <input {...props} type="time" disabled={override.closed} className="input" value={override.end} onChange={(event) => setOverride({ ...override, end: event.target.value })} />}</Field>
          <div className="pb-5"><button type="button" className="btn-outline w-full" onClick={submitOverride}>Save override</button></div>
        </div>
        <ul className="divide-y divide-line">
          {availability.overrides.map((item: Override) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span>{formatDate(item.date)} · {item.closed ? 'Closed' : item.ranges.map((range) => `${formatTime(range.start)} - ${formatTime(range.end)}`).join(', ')}</span>
              <button type="button" className="btn-danger" aria-label="Delete override" onClick={() => deleteOverride(item.id).then((updated) => setAvailability({ ...availability, overrides: updated.overrides }))}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={leaveToDelete !== null}
        title="Delete leave?"
        message="Slots on these dates will become bookable again."
        confirmLabel="Delete"
        danger
        onCancel={() => setLeaveToDelete(null)}
        onConfirm={async () => {
          if (!leaveToDelete) return
          const updated = await deleteLeave(leaveToDelete.id)
          setAvailability({ ...availability, leaves: updated.leaves })
          setLeaveToDelete(null)
          toast.success('Leave deleted')
        }}
      />
    </div>
  )
}

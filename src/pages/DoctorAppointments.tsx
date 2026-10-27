import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Drawer, EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Pagination, Spinner, StatusBadge, Tabs, paginate } from '../components/ui'
import { getDoctorAppointments, getPatientHistory, updateAppointmentStatus } from '../data/doctorStore'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Appointment, AppointmentStatus } from '../types'
import { errorMessage } from '../utils/errors'
import { addDaysISO, formatDate, formatShortDay, formatTime, parseISODate, toISODate, todayISO } from '../utils/format'

type ViewId = 'day' | 'week' | 'list'
const PAGE_SIZE = 6
const ALL_STATUSES: AppointmentStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED_BY_DOCTOR', 'CANCELLED_BY_PATIENT']

function weekStart(date: string): string {
  const day = parseISODate(date).getDay()
  return addDaysISO(date, -((day + 6) % 7))
}

export function DoctorAppointments() {
  useDocumentMeta('Appointments')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data, loading, error, reload } = useAsync(getDoctorAppointments)
  const [view, setView] = useState<ViewId>('day')
  const [date, setDate] = useState(todayISO())
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(searchParams.get('open'))
  const [reasonAction, setReasonAction] = useState<{ appointment: Appointment; status: AppointmentStatus; label: string } | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [busy, setBusy] = useState(false)

  const all = data ?? []
  const selected = all.find((item) => item.id === openId) ?? null
  const history = useAsync(async () => (selected ? getPatientHistory(selected.patientUserId) : null), [selected?.patientUserId])

  const run = async (appointment: Appointment, status: AppointmentStatus, note = '') => {
    setBusy(true)
    try {
      await updateAppointmentStatus(appointment.id, status, note)
      toast.success('Appointment updated')
      setReasonAction(null)
      setReason('')
      reload()
      if (status === 'IN_PROGRESS') navigate(`/doctor/consultation/${appointment.id}`)
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const confirmReason = () => {
    if (!reasonAction) return
    if (!reason.trim()) {
      setReasonError('A reason is required')
      return
    }
    setReasonError('')
    run(reasonAction.appointment, reasonAction.status, reason.trim())
  }

  const row = (appointment: Appointment) => (
    <button
      key={appointment.id}
      type="button"
      onClick={() => setOpenId(appointment.id)}
      className="card flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left hover:border-primary"
    >
      <span>
        <span className="block text-sm font-semibold">{formatTime(appointment.startTime)} · {appointment.patient.name}</span>
        <span className="block text-xs text-muted">{formatDate(appointment.date)} · {appointment.mode === 'VIDEO' ? 'Video' : 'Clinic'} · {appointment.reason}</span>
      </span>
      <StatusBadge status={appointment.status} />
    </button>
  )

  const dayItems = all.filter((item) => item.date === date)
  const start = weekStart(date)
  const listItems = all
    .filter((item) => (!statusFilter || item.status === statusFilter) && (!dateFilter || item.date === dateFilter))
    .sort((first, second) => `${second.date}${second.startTime}`.localeCompare(`${first.date}${first.startTime}`))

  const actions = (appointment: Appointment) => {
    const buttons: { label: string; className: string; onClick: () => void }[] = []
    const ask = (status: AppointmentStatus, label: string) => () => {
      setReasonAction({ appointment, status, label })
      setReason('')
      setReasonError('')
    }
    if (appointment.status === 'PENDING_PAYMENT') {
      buttons.push({ label: 'Confirm', className: 'btn-primary', onClick: () => run(appointment, 'CONFIRMED') })
      buttons.push({ label: 'Reject', className: 'btn-danger', onClick: ask('CANCELLED_BY_DOCTOR', 'Reject') })
    }
    if (appointment.status === 'CONFIRMED') {
      buttons.push({ label: 'Start', className: 'btn-primary', onClick: () => run(appointment, 'IN_PROGRESS') })
      buttons.push({ label: 'No-show', className: 'btn-ghost', onClick: () => run(appointment, 'NO_SHOW') })
      buttons.push({ label: 'Cancel', className: 'btn-danger', onClick: ask('CANCELLED_BY_DOCTOR', 'Cancel') })
    }
    if (appointment.status === 'IN_PROGRESS') {
      buttons.push({ label: 'Open consultation', className: 'btn-outline', onClick: () => navigate(`/doctor/consultation/${appointment.id}`) })
      buttons.push({ label: 'Complete', className: 'btn-primary', onClick: () => run(appointment, 'COMPLETED') })
    }
    if (appointment.status === 'COMPLETED') {
      buttons.push({ label: 'View consultation', className: 'btn-outline', onClick: () => navigate(`/doctor/consultation/${appointment.id}`) })
    }
    return buttons
  }

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Times are in your local (clinic) time." />
      <Tabs<ViewId> tabs={[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'list', label: 'List' }]} active={view} onChange={setView} />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && view !== 'list' && (
        <div className="mb-4 flex items-center gap-2">
          <button type="button" className="btn-ghost px-2" aria-label="Previous" onClick={() => setDate(addDaysISO(date, view === 'day' ? -1 : -7))}><ChevronLeft size={16} /></button>
          <span className="min-w-48 text-center font-semibold">{view === 'day' ? formatDate(date) : `${formatDate(start)} - ${formatDate(addDaysISO(start, 6))}`}</span>
          <button type="button" className="btn-ghost px-2" aria-label="Next" onClick={() => setDate(addDaysISO(date, view === 'day' ? 1 : 7))}><ChevronRight size={16} /></button>
          <button type="button" className="btn-outline" onClick={() => setDate(todayISO())}>Today</button>
        </div>
      )}

      {!loading && view === 'day' && (
        <div className="space-y-2">
          {dayItems.length === 0 && <EmptyState title="No appointments on this day" />}
          {dayItems.map(row)}
        </div>
      )}

      {!loading && view === 'week' && (
        <div className="grid gap-2 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => addDaysISO(start, index)).map((day) => {
            const parts = formatShortDay(day)
            const items = all.filter((item) => item.date === day)
            return (
              <div key={day} className={`card min-h-24 p-2 ${day === todayISO() ? 'border-primary' : ''}`}>
                <p className="mb-1 text-xs font-semibold">{parts.weekday} {parts.day} {parts.month}</p>
                {items.length === 0 && <p className="text-xs text-muted">-</p>}
                {items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setOpenId(item.id)} className="mb-1 block w-full truncate rounded bg-primary-soft px-1.5 py-1 text-left text-xs hover:bg-line">
                    {formatTime(item.startTime)} {item.patient.name}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {!loading && view === 'list' && (
        <div>
          <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
            <Field label="Status">
              {(props) => (
                <select {...props} className="input" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
                  <option value="">All statuses</option>
                  {ALL_STATUSES.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
                </select>
              )}
            </Field>
            <Field label="Date">{(props) => <input {...props} type="date" className="input" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1) }} />}</Field>
          </div>
          {listItems.length === 0 && <EmptyState title="No appointments match" />}
          <div className="space-y-2">{paginate(listItems, page, PAGE_SIZE).map(row)}</div>
          <Pagination page={page} total={listItems.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      )}

      <Drawer open={selected !== null} title="Appointment" onClose={() => setOpenId(null)}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{selected.patient.name}</p>
              <StatusBadge status={selected.status} />
            </div>
            <p>{formatDate(selected.date)}, {formatTime(selected.startTime)} · {selected.mode === 'VIDEO' ? 'Video' : selected.clinic.name}</p>
            <dl className="grid grid-cols-2 gap-2 rounded-lg bg-primary-soft p-3">
              <dt className="text-muted">Age</dt><dd>{selected.patientInfo.age}</dd>
              <dt className="text-muted">Gender</dt><dd>{selected.patientInfo.gender}</dd>
              <dt className="text-muted">Allergies</dt><dd>{selected.patientInfo.allergies}</dd>
              <dt className="text-muted">Conditions</dt><dd>{selected.patientInfo.conditions}</dd>
              <dt className="text-muted">Reason</dt><dd>{selected.reason}</dd>
            </dl>
            <div>
              <h3 className="mb-1 font-semibold">History with you</h3>
              {history.loading && <Spinner />}
              {history.data && history.data.appointments.filter((item) => item.id !== selected.id).length === 0 && <p className="text-muted">No previous visits.</p>}
              <ul className="space-y-1">
                {history.data?.appointments.filter((item) => item.id !== selected.id).map((item) => (
                  <li key={item.id} className="flex justify-between"><span>{formatDate(item.date)}</span><StatusBadge status={item.status} /></li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions(selected).map((button) => (
                <button key={button.label} type="button" className={button.className} disabled={busy} onClick={button.onClick}>{button.label}</button>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={reasonAction !== null}
        title={`${reasonAction?.label ?? ''} appointment`}
        onClose={() => setReasonAction(null)}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setReasonAction(null)}>Back</button>
            <button type="button" className="btn-danger" disabled={busy} onClick={confirmReason}>{busy && <Spinner />} Confirm</button>
          </>
        }
      >
        <Field label="Reason (shared with the patient)" error={reasonError}>
          {(props) => <textarea {...props} className="input" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}
        </Field>
      </Modal>
    </div>
  )
}

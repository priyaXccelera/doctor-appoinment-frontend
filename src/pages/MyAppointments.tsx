import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video } from 'lucide-react'
import { AppointmentActions } from '../components/AppointmentActions'
import { CancelAppointmentModal, RescheduleModal, ReviewModal } from '../components/AppointmentModals'
import { Avatar, EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, StatusBadge, Tabs, paginate } from '../components/ui'
import { getMyAppointments } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Appointment } from '../types'
import { formatDate, formatINR, formatTime } from '../utils/format'

type TabId = 'upcoming' | 'completed' | 'cancelled'

const TAB_STATUSES: Record<TabId, string[]> = {
  upcoming: ['CONFIRMED', 'PENDING_PAYMENT', 'RESCHEDULED', 'IN_PROGRESS'],
  completed: ['COMPLETED', 'NO_SHOW'],
  cancelled: ['CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'EXPIRED'],
}

const PAGE_SIZE = 4

export function MyAppointments() {
  useDocumentMeta('My appointments')
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(getMyAppointments)
  const [tab, setTab] = useState<TabId>('upcoming')
  const [page, setPage] = useState(1)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null)

  const all = data ?? []
  const filtered = all
    .filter((item) => TAB_STATUSES[tab].includes(item.status))
    .sort((first, second) =>
      tab === 'upcoming'
        ? `${first.date}${first.startTime}`.localeCompare(`${second.date}${second.startTime}`)
        : `${second.date}${second.startTime}`.localeCompare(`${first.date}${first.startTime}`),
    )
  const countFor = (id: TabId) => all.filter((item) => TAB_STATUSES[id].includes(item.status)).length
  const done = () => {
    setCancelTarget(null)
    setRescheduleTarget(null)
    setReviewTarget(null)
    reload()
  }

  return (
    <div>
      <PageHeader title="My appointments" subtitle="Times are shown in the doctor's local time." />
      <Tabs
        tabs={[
          { id: 'upcoming', label: 'Upcoming', count: countFor('upcoming') },
          { id: 'completed', label: 'Completed', count: countFor('completed') },
          { id: 'cancelled', label: 'Cancelled', count: countFor('cancelled') },
        ]}
        active={tab}
        onChange={(id) => {
          setTab(id)
          setPage(1)
        }}
      />
      {loading && <ListSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title={`No ${tab} appointments`}
          hint="Find a doctor and book your next visit."
          action={<Link to="/doctors" className="btn-primary">Find doctors</Link>}
        />
      )}
      <div className="space-y-4">
        {paginate(filtered, page, PAGE_SIZE).map((appointment) => (
          <article key={appointment.id} className="card space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button type="button" className="flex items-center gap-3 text-left" onClick={() => navigate(`/appointments/${appointment.id}`)}>
                <Avatar src={appointment.doctor.photoUrl} name={appointment.doctor.name} size={52} />
                <span>
                  <span className="block font-bold hover:text-primary-text">{appointment.doctor.name}</span>
                  <span className="block text-sm text-primary-text">{appointment.doctor.specialties.join(', ')}</span>
                  <span className="block text-xs text-muted">Ref {appointment.referenceNo} · For {appointment.patient.name}</span>
                </span>
              </button>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={appointment.status} />
                <StatusBadge status={appointment.paymentStatus} />
              </div>
            </div>
            <div className="grid gap-1 text-sm sm:grid-cols-3">
              <p>{formatDate(appointment.date)}, {formatTime(appointment.startTime)}</p>
              <p className="flex items-center gap-1">
                {appointment.mode === 'VIDEO' ? <><Video size={14} aria-hidden="true" /> Video consultation</> : `Clinic: ${appointment.clinic.name}`}
              </p>
              <p className="font-semibold">{formatINR(appointment.fee)}</p>
            </div>
            <AppointmentActions appointment={appointment} onCancel={setCancelTarget} onReschedule={setRescheduleTarget} onReview={setReviewTarget} />
          </article>
        ))}
      </div>
      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <CancelAppointmentModal appointment={cancelTarget} onClose={() => setCancelTarget(null)} onDone={done} />
      <RescheduleModal appointment={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onDone={done} />
      <ReviewModal appointment={reviewTarget} onClose={() => setReviewTarget(null)} onDone={done} />
    </div>
  )
}

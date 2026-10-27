import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, MapPin, Video } from 'lucide-react'
import { AppointmentActions } from '../components/AppointmentActions'
import { CancelAppointmentModal, RescheduleModal, ReviewModal } from '../components/AppointmentModals'
import { Avatar, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/ui'
import { getAppointment, getPrescription } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Appointment } from '../types'
import { formatDate, formatDateTime, formatINR, formatTime, relativeTime } from '../utils/format'

export function AppointmentDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  useDocumentMeta('Appointment details')
  const { data: appointment, loading, error, reload } = useAsync(() => getAppointment(id), [id])
  const prescription = useAsync(async () => (appointment?.prescriptionId ? getPrescription(appointment.prescriptionId) : undefined), [appointment?.prescriptionId])
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null)

  const done = () => {
    setCancelTarget(null)
    setRescheduleTarget(null)
    setReviewTarget(null)
    reload()
  }

  if (loading) return <Skeleton className="h-64 w-full" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!appointment) {
    return <EmptyState title="Appointment not found" action={<Link to="/appointments" className="btn-primary">Back to appointments</Link>} />
  }

  return (
    <div className="space-y-6">
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>
      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={appointment.doctor.photoUrl} name={appointment.doctor.name} size={64} />
            <div>
              <h1 className="text-xl font-bold">{appointment.doctor.name}</h1>
              <p className="text-sm text-primary-text">{appointment.doctor.specialties.join(', ')}</p>
              <p className="text-xs text-muted">Reference {appointment.referenceNo}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={appointment.status} />
            <StatusBadge status={appointment.paymentStatus} />
          </div>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Date &amp; time</dt><dd className="font-medium">{formatDate(appointment.date)}, {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)} (doctor&apos;s local time)</dd></div>
          <div><dt className="text-muted">Patient</dt><dd className="font-medium">{appointment.patient.name} ({appointment.patient.relation})</dd></div>
          <div>
            <dt className="text-muted">Mode</dt>
            <dd className="flex items-center gap-1 font-medium">
              {appointment.mode === 'VIDEO' ? <><Video size={14} /> Video consultation</> : <><MapPin size={14} /> {appointment.clinic.name}, {appointment.clinic.address}</>}
            </dd>
          </div>
          <div><dt className="text-muted">Fee</dt><dd className="font-medium">{formatINR(appointment.fee)}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted">Reason</dt><dd className="font-medium">{appointment.reason}</dd></div>
        </dl>
        <AppointmentActions appointment={appointment} onCancel={setCancelTarget} onReschedule={setRescheduleTarget} onReview={setReviewTarget} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold">Status timeline</h2>
        <ol className="space-y-4 border-l-2 border-line pl-5">
          {appointment.history.map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
              <p className="text-sm font-semibold">{entry.action}</p>
              <p className="text-xs text-muted">{entry.actor} · {formatDateTime(entry.timestamp)} ({relativeTime(entry.timestamp)})</p>
              {entry.note && <p className="text-xs">{entry.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-lg font-bold">Doctor&apos;s notes</h2>
        <p className="text-sm text-muted">{appointment.notes || 'No notes were added for this appointment.'}</p>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold"><FileText size={18} /> Prescription</h2>
        {prescription.data ? (
          <div className="space-y-2 text-sm">
            <p><strong>Diagnosis:</strong> {prescription.data.diagnosis}</p>
            <ul className="list-inside list-disc">
              {prescription.data.medicines.map((medicine) => (
                <li key={medicine.name}>{medicine.name} - {medicine.dosage}, {medicine.frequency}, {medicine.duration}</li>
              ))}
            </ul>
            <Link to={`/prescriptions/${prescription.data.id}`} className="btn-outline">View full prescription</Link>
          </div>
        ) : (
          <p className="text-sm text-muted">No prescription has been issued yet.</p>
        )}
      </section>

      <CancelAppointmentModal appointment={cancelTarget} onClose={() => setCancelTarget(null)} onDone={done} />
      <RescheduleModal appointment={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onDone={done} />
      <ReviewModal appointment={reviewTarget} onClose={() => setReviewTarget(null)} onDone={done} />
    </div>
  )
}

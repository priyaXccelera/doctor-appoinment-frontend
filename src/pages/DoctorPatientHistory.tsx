import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, StatusBadge, paginate } from '../components/ui'
import { getPatientHistory } from '../data/doctorStore'
import { useAsync, useDocumentMeta } from '../hooks'
import { formatDate, formatTime } from '../utils/format'

const PAGE_SIZE = 4

export function DoctorPatientHistory() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  useDocumentMeta('Patient history')
  const { data, loading, error, reload } = useAsync(() => getPatientHistory(id), [id])
  const [page, setPage] = useState(1)
  const appointments = data?.appointments ?? []

  return (
    <div>
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      <PageHeader title={appointments[0] ? `${appointments[0].patient.name} - history` : 'Patient history'} subtitle="Consultation history with you." />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && appointments.length === 0 && <EmptyState title="No history with this patient" />}
      <ol className="space-y-3 border-l-2 border-line pl-5">
        {paginate(appointments, page, PAGE_SIZE).map((appointment) => {
          const rx = data?.prescriptions.find((item) => item.appointmentId === appointment.id)
          return (
            <li key={appointment.id} className="relative">
              <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
              <article className="card space-y-1 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{formatDate(appointment.date)}, {formatTime(appointment.startTime)} · {appointment.mode === 'VIDEO' ? 'Video' : 'Clinic'}</p>
                  <StatusBadge status={appointment.status} />
                </div>
                <p>Reason: {appointment.reason}</p>
                <p className="text-muted">Notes: {appointment.notes || 'None'}</p>
                {rx && <p>Prescription: {rx.diagnosis} ({rx.medicines.map((medicine) => medicine.name).join(', ')})</p>}
              </article>
            </li>
          )
        })}
      </ol>
      <Pagination page={page} total={appointments.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

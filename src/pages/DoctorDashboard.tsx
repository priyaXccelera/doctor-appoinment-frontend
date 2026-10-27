import { Link, useNavigate } from 'react-router-dom'
import { Play, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState, ErrorState, PageHeader, Skeleton, Stars, Stat, StatusBadge } from '../components/ui'
import { getDoctorDashboard, updateAppointmentStatus } from '../data/doctorStore'
import { useAsync, useDocumentMeta } from '../hooks'
import { errorMessage } from '../utils/errors'
import { formatDate, formatINR, formatTime } from '../utils/format'

export function DoctorDashboard() {
  useDocumentMeta('Doctor dashboard')
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(getDoctorDashboard)

  if (loading) return <div className="grid gap-4 sm:grid-cols-4"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
  if (error || !data) return <ErrorState message={error || 'Unable to load dashboard'} onRetry={reload} />

  const next = data.nextPatient
  const startConsultation = async () => {
    if (!next) return
    try {
      if (next.status === 'CONFIRMED') await updateAppointmentStatus(next.id, 'IN_PROGRESS')
      navigate(`/doctor/consultation/${next.id}`)
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  return (
    <div>
      <PageHeader title="Doctor dashboard" subtitle={formatDate(new Date().toISOString().slice(0, 10))} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today" value={data.todayCount} hint="appointments" />
        <Stat label="Upcoming" value={data.upcomingCount} hint="after today" />
        <Stat label="Completed this week" value={data.completedThisWeek} />
        <Stat label="Earnings (30 days)" value={formatINR(data.earningsThisMonth)} hint="net of commission" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Today&apos;s appointments</h2>
          {data.today.length === 0 && <EmptyState title="No appointments today" />}
          <ol className="space-y-3 border-l-2 border-line pl-5">
            {data.today.map((appointment) => (
              <li key={appointment.id} className="relative">
                <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                <Link to={`/doctor/appointments?open=${appointment.id}`} className="card flex flex-wrap items-center justify-between gap-2 p-3 hover:border-primary">
                  <span>
                    <span className="block text-sm font-semibold">{formatTime(appointment.startTime)} · {appointment.patient.name}</span>
                    <span className="block text-xs text-muted">{appointment.mode === 'VIDEO' ? 'Video' : 'Clinic'} · {appointment.reason}</span>
                  </span>
                  <StatusBadge status={appointment.status} />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Next patient</h2>
            {next ? (
              <div className="space-y-2 text-sm">
                <p className="text-base font-semibold">{next.patient.name}</p>
                <p className="text-muted">{formatTime(next.startTime)} · {next.mode === 'VIDEO' ? <Video size={12} className="inline" /> : null} {next.mode === 'VIDEO' ? 'Video consult' : 'Clinic visit'}</p>
                <p>{next.reason}</p>
                <button type="button" className="btn-primary w-full" onClick={startConsultation}>
                  <Play size={16} /> Start consultation
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">No patients waiting right now.</p>
            )}
          </section>
          <section className="card p-5">
            <h2 className="mb-3 text-lg font-bold">Recent reviews</h2>
            {data.recentReviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
            <ul className="space-y-3">
              {data.recentReviews.slice(0, 3).map((review) => (
                <li key={review.id} className="text-sm">
                  <Stars value={review.rating} size={12} />
                  <p className="line-clamp-2">{review.comment}</p>
                  <p className="text-xs text-muted">{review.patientName}</p>
                </li>
              ))}
            </ul>
            <Link to="/doctor/reviews" className="mt-2 inline-block text-sm font-semibold text-primary-text">All reviews</Link>
          </section>
        </div>
      </div>
    </div>
  )
}

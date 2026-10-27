import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BadgeCheck, Languages, MapPin, ShieldCheck, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { SlotPicker } from '../components/SlotPicker'
import type { SelectedSlot } from '../components/SlotPicker'
import { Avatar, EmptyState, ErrorState, Pagination, Skeleton, Stars, Tabs } from '../components/ui'
import { currentRole } from '../auth/auth'
import { getDoctor, getDoctorReviews, holdSlot } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Mode } from '../types'
import { errorCode, errorMessage } from '../utils/errors'
import { formatDate, formatINR, formatTime } from '../utils/format'
import { saveDraft } from '../utils/bookingDraft'

type TabId = 'about' | 'clinics' | 'services' | 'reviews' | 'faq'

function ReviewsTab({ doctorId }: { doctorId: string }) {
  const [page, setPage] = useState(1)
  const { data, loading } = useAsync(() => getDoctorReviews(doctorId, page, 4), [doctorId, page])
  const all = data?.all ?? []
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: all.filter((review) => review.rating === star).length }))
  if (loading && !data) return <Skeleton className="h-40 w-full" />
  if (!data || data.total === 0) return <EmptyState title="No reviews yet" hint="Be the first to review after your visit." />
  return (
    <div className="space-y-4">
      <div className="card space-y-1 p-4">
        {breakdown.map((row) => (
          <div key={row.star} className="flex items-center gap-2 text-sm">
            <span className="w-8">{row.star}★</span>
            <div className="h-2 flex-1 rounded-full bg-line" role="presentation">
              <div className="h-2 rounded-full bg-amber-400" style={{ width: `${(row.count / Math.max(1, all.length)) * 100}%` }} />
            </div>
            <span className="w-6 text-right text-muted">{row.count}</span>
          </div>
        ))}
      </div>
      {data.items.map((review) => (
        <article key={review.id} className="card p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{review.patientName}</p>
            <span className="text-xs text-muted">{formatDate(review.date)}</span>
          </div>
          <Stars value={review.rating} size={14} />
          <p className="mt-2 text-sm">{review.comment}</p>
          {review.reply && (
            <p className="mt-2 rounded-lg bg-primary-soft p-3 text-sm">
              <strong>Doctor&apos;s reply:</strong> {review.reply}
            </p>
          )}
        </article>
      ))}
      <Pagination page={page} total={data.total} pageSize={4} onChange={setPage} />
    </div>
  )
}

export function DoctorProfile() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: doctor, loading, error, reload } = useAsync(() => getDoctor(id), [id])
  const [tab, setTab] = useState<TabId>('about')
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'VIDEO' ? 'VIDEO' : 'CLINIC')
  const [clinicId, setClinicId] = useState('')
  const [selected, setSelected] = useState<SelectedSlot | null>(null)
  const [booking, setBooking] = useState(false)
  const [message, setMessage] = useState<string>((location.state as { message?: string } | null)?.message ?? '')
  const [refreshKey, setRefreshKey] = useState(0)

  useDocumentMeta(
    doctor ? `${doctor.name} - ${doctor.specialties[0]}` : 'Doctor profile',
    doctor ? `Book an appointment with ${doctor.name}, ${doctor.specialties.join(', ')} with ${doctor.experienceYears} years of experience.` : undefined,
    doctor
      ? {
          '@context': 'https://schema.org',
          '@type': 'Physician',
          name: doctor.name,
          medicalSpecialty: doctor.specialties,
          aggregateRating: { '@type': 'AggregateRating', ratingValue: doctor.rating, reviewCount: doctor.reviewCount },
        }
      : undefined,
  )

  if (loading) return <div className="mx-auto max-w-6xl space-y-4 px-4 py-8"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (error) return <div className="mx-auto max-w-3xl px-4 py-8"><ErrorState message={error} onRetry={reload} /></div>
  if (!doctor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title="Doctor not found" action={<Link className="btn-primary" to="/doctors">Back to search</Link>} />
      </div>
    )
  }

  const activeClinicId = clinicId || doctor.clinics[0]?.id || ''
  const activeClinic = doctor.clinics.find((clinic) => clinic.id === activeClinicId)
  const fee = mode === 'VIDEO' ? doctor.consultationFees.video : doctor.consultationFees.clinic

  const handleBook = async () => {
    if (!selected) return
    const role = currentRole()
    if (!role) {
      toast('Please log in to book your appointment')
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    if (role !== 'PATIENT') {
      setMessage('Only patient accounts can book appointments.')
      return
    }
    setBooking(true)
    setMessage('')
    try {
      const hold = await holdSlot({ doctorId: doctor.id, clinicId: activeClinicId, mode, date: selected.date, startTime: selected.startTime })
      saveDraft({ hold, patientMemberId: 'self', reason: '', payAtClinic: false })
      navigate('/book')
    } catch (caught) {
      setMessage(errorMessage(caught))
      if (errorCode(caught) === 'SLOT_TAKEN') {
        setSelected(null)
        setRefreshKey((value) => value + 1)
      }
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="card flex flex-col gap-4 p-5 sm:flex-row">
        <Avatar src={doctor.photoUrl} name={doctor.name} size={112} />
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {doctor.name}
            {doctor.verification === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                <BadgeCheck size={14} aria-hidden="true" /> Verified
              </span>
            )}
          </h1>
          <p className="font-medium text-primary-text">{doctor.specialties.join(', ')}</p>
          <p className="text-sm text-muted">{doctor.qualifications.join(', ')}</p>
          <p className="flex items-center gap-2 text-sm">
            <Stars value={doctor.rating} /> <strong>{doctor.rating}</strong>
            <span className="text-muted">({doctor.reviewCount} reviews)</span>
          </p>
          <p className="text-sm">{doctor.experienceYears} years of experience</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <ShieldCheck size={14} aria-hidden="true" /> Reg. no. {doctor.registrationNo} · {doctor.council}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <Tabs<TabId>
            tabs={[
              { id: 'about', label: 'About' },
              { id: 'clinics', label: 'Clinics', count: doctor.clinics.length },
              { id: 'services', label: 'Services' },
              { id: 'reviews', label: 'Reviews', count: doctor.reviewCount },
              { id: 'faq', label: 'FAQ' },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === 'about' && (
            <div className="card space-y-3 p-5 text-sm">
              <p>{doctor.about || 'This doctor has not added an introduction yet.'}</p>
              <p className="flex items-center gap-2 text-muted">
                <Languages size={16} aria-hidden="true" /> Speaks {doctor.languages.join(', ')}
              </p>
            </div>
          )}
          {tab === 'clinics' && (
            <div className="space-y-4">
              {doctor.clinics.length === 0 && <EmptyState title="No clinics added yet" />}
              {doctor.clinics.map((clinic) => (
                <div key={clinic.id} className="card space-y-3 p-4">
                  <h3 className="font-bold">{clinic.name}</h3>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    <MapPin size={14} aria-hidden="true" /> {clinic.address}
                  </p>
                  <iframe
                    title={`Map of ${clinic.name}`}
                    className="h-48 w-full rounded-lg border border-line"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${clinic.lng - 0.01}%2C${clinic.lat - 0.008}%2C${clinic.lng + 0.01}%2C${clinic.lat + 0.008}&layer=mapnik&marker=${clinic.lat}%2C${clinic.lng}`}
                  />
                  <div className="flex gap-2">
                    {clinic.photos.map((photo, index) => (
                      <img key={photo} src={photo} alt={`${clinic.name} photo ${index + 1}`} loading="lazy" className="h-20 w-32 rounded-lg bg-line object-cover" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'services' && (
            <ul className="card divide-y divide-line">
              {doctor.services.length === 0 && <li className="p-4 text-sm text-muted">No services listed.</li>}
              {doctor.services.map((service) => (
                <li key={service} className="p-4 text-sm">{service}</li>
              ))}
            </ul>
          )}
          {tab === 'reviews' && <ReviewsTab doctorId={doctor.id} />}
          {tab === 'faq' && (
            <div className="space-y-2">
              {doctor.faqs.length === 0 && <EmptyState title="No FAQs yet" />}
              {doctor.faqs.map((faq) => (
                <details key={faq.q} className="card p-4">
                  <summary className="cursor-pointer font-semibold">{faq.q}</summary>
                  <p className="mt-2 text-sm text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>

        <aside aria-label="Book appointment" className="card h-fit space-y-4 p-4 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">Book appointment</h2>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-primary-soft p-1" role="group" aria-label="Consultation mode">
            {(['CLINIC', 'VIDEO'] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                disabled={!doctor.modes.includes(item)}
                onClick={() => {
                  setMode(item)
                  setSelected(null)
                }}
                className={`flex items-center justify-center gap-1 rounded-md py-2 text-sm font-semibold ${mode === item ? 'bg-primary text-white' : 'text-primary-text'}`}
              >
                {item === 'VIDEO' && <Video size={14} aria-hidden="true" />}
                {item === 'CLINIC' ? 'Clinic visit' : 'Video consult'}
              </button>
            ))}
          </div>
          {mode === 'CLINIC' && doctor.clinics.length > 0 && (
            <div>
              <label htmlFor="clinic-select" className="mb-1 block text-sm font-medium">
                Clinic
              </label>
              <select
                id="clinic-select"
                className="input"
                value={activeClinicId}
                onChange={(event) => {
                  setClinicId(event.target.value)
                  setSelected(null)
                }}
              >
                {doctor.clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} - {clinic.locality}
                  </option>
                ))}
              </select>
            </div>
          )}
          <SlotPicker doctorId={doctor.id} mode={mode} clinicId={mode === 'CLINIC' ? activeClinicId : undefined} selected={selected} onSelect={setSelected} refreshKey={refreshKey} />
          {selected && (
            <p className="rounded-lg bg-primary-soft p-3 text-sm" role="status">
              Selected: <strong>{formatDate(selected.date)}, {formatTime(selected.startTime)}</strong>
              {activeClinic && mode === 'CLINIC' && ` at ${activeClinic.name}`}
            </p>
          )}
          {message && (
            <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
              {message}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Consultation fee</span>
            <strong className="text-lg">{formatINR(fee)}</strong>
          </div>
          <button type="button" className="btn-primary w-full" disabled={!selected || booking} onClick={handleBook}>
            {booking ? 'Holding slot...' : 'Book appointment'}
          </button>
        </aside>
      </div>
    </div>
  )
}

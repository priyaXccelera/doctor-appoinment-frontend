import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, Clock, MapPin, Video } from 'lucide-react'
import type { DoctorListItem } from '../types'
import { formatDate, formatINR, formatTime } from '../utils/format'
import { Avatar, Stars } from './ui'

export function DoctorCard({ doctor }: { doctor: DoctorListItem }) {
  const navigate = useNavigate()
  const clinic = doctor.clinics[0]
  const next = doctor.nextAvailableSlot

  return (
    <article className="card flex flex-col gap-4 p-4 sm:flex-row">
      <Link to={`/doctors/${doctor.id}`} aria-label={`View profile of ${doctor.name}`}>
        <Avatar src={doctor.photoUrl} name={doctor.name} size={88} />
      </Link>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="flex items-center gap-1 text-lg font-bold">
          <Link to={`/doctors/${doctor.id}`} className="hover:text-primary-text">
            {doctor.name}
          </Link>
          <BadgeCheck size={18} className="text-primary-text" aria-label="Verified" />
        </h3>
        <p className="text-sm font-medium text-primary-text">{doctor.specialties.join(', ')}</p>
        <p className="text-sm text-muted">
          {doctor.qualifications.join(', ')} · {doctor.experienceYears} yrs experience
        </p>
        <p className="flex items-center gap-2 text-sm">
          <Stars value={doctor.rating} size={14} />
          <span className="font-semibold">{doctor.rating}</span>
          <span className="text-muted">({doctor.reviewCount} reviews)</span>
        </p>
        {clinic && (
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin size={14} aria-hidden="true" /> {clinic.name}, {clinic.locality}
          </p>
        )}
        <p className="text-xs text-muted">Speaks: {doctor.languages.join(', ')}</p>
        <p className="flex items-center gap-1 text-sm">
          <Clock size={14} aria-hidden="true" />
          {next ? (
            <span>
              Next available: <strong>{formatDate(next.date)}, {formatTime(next.startTime)}</strong>
            </span>
          ) : (
            <span className="text-muted">No slots in the next 14 days</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col justify-between gap-3 sm:w-48">
        <div className="sm:text-right">
          <p className="text-xs text-muted">Consultation fee</p>
          <p className="text-lg font-bold">{formatINR(doctor.consultationFees.clinic)}</p>
          <p className="text-xs text-muted">Video: {formatINR(doctor.consultationFees.video)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="btn-primary" onClick={() => navigate(`/doctors/${doctor.id}?mode=CLINIC`)}>
            Book Clinic Visit
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate(`/doctors/${doctor.id}?mode=VIDEO`)}>
            <Video size={16} aria-hidden="true" /> Video Consult
          </button>
        </div>
      </div>
    </article>
  )
}

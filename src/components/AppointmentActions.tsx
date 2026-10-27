import { useNavigate } from 'react-router-dom'
import { Download, RefreshCw, Repeat, Star, Video, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { JOIN_VIDEO_WINDOW_MINUTES } from '../constants'
import { getPrescription, getVideoLink } from '../data/store'
import { useCountdown } from '../hooks'
import type { Appointment } from '../types'
import { downloadPrescription } from '../utils/prescriptionText'
import { appointmentStart, formatCountdown } from '../utils/format'

interface ActionsProps {
  appointment: Appointment
  onCancel: (appointment: Appointment) => void
  onReschedule: (appointment: Appointment) => void
  onReview: (appointment: Appointment) => void
}

export function AppointmentActions({ appointment, onCancel, onReschedule, onReview }: ActionsProps) {
  const navigate = useNavigate()
  const start = appointmentStart(appointment.date, appointment.startTime)
  const opensAt = new Date(start.getTime() - JOIN_VIDEO_WINDOW_MINUTES * 60000).toISOString()
  const secondsToOpen = useCountdown(opensAt)
  const ended = Date.now() > new Date(`${appointment.date}T${appointment.endTime}:00`).getTime() + 3600000
  const showJoin = appointment.mode === 'VIDEO' && (appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS')
  const joinEnabled = showJoin && (secondsToOpen === 0 || appointment.status === 'IN_PROGRESS') && !ended

  const join = async () => {
    const url = await getVideoLink(appointment.id)
    window.open(url, '_blank', 'noopener')
  }

  const download = async () => {
    if (!appointment.prescriptionId) return
    const rx = await getPrescription(appointment.prescriptionId)
    if (rx) downloadPrescription(rx)
    else toast.error('Prescription not found')
  }

  const daysSince = Math.floor((Date.now() - start.getTime()) / 86400000)
  const followUpLabel = daysSince <= 7 ? 'Book free follow-up' : 'Book follow-up (discounted)'

  return (
    <div className="flex flex-wrap gap-2">
      {showJoin && (
        <button type="button" className="btn-primary" disabled={!joinEnabled} onClick={join}>
          <Video size={16} aria-hidden="true" />
          {joinEnabled ? 'Join video' : `Join opens in ${formatCountdown(secondsToOpen)}`}
        </button>
      )}
      {appointment.canReschedule && (
        <button type="button" className="btn-ghost" onClick={() => onReschedule(appointment)}>
          <RefreshCw size={16} aria-hidden="true" /> Reschedule
        </button>
      )}
      {appointment.canCancel && (
        <button type="button" className="btn-danger" onClick={() => onCancel(appointment)}>
          <XCircle size={16} aria-hidden="true" /> Cancel
        </button>
      )}
      {appointment.status === 'COMPLETED' && appointment.prescriptionId && (
        <button type="button" className="btn-ghost" onClick={download}>
          <Download size={16} aria-hidden="true" /> Prescription
        </button>
      )}
      {appointment.status === 'COMPLETED' && !appointment.reviewed && (
        <button type="button" className="btn-outline" onClick={() => onReview(appointment)}>
          <Star size={16} aria-hidden="true" /> Write a review
        </button>
      )}
      {appointment.status === 'COMPLETED' && (
        <button type="button" className="btn-outline" onClick={() => navigate(`/doctors/${appointment.doctorId}?mode=${appointment.mode}`)}>
          <Repeat size={16} aria-hidden="true" /> {followUpLabel}
        </button>
      )}
    </div>
  )
}

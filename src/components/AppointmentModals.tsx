import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { cancelAppointment, createReview, getRefundPreview, holdSlot, rescheduleAppointment } from '../data/store'
import { useCountdown } from '../hooks'
import type { Appointment, Hold } from '../types'
import { errorCode, errorMessage } from '../utils/errors'
import { formatDate, formatINR, formatTime } from '../utils/format'
import type { RefundPreview } from '../utils/refund'
import { CountdownBadge } from './CountdownBadge'
import { SlotPicker } from './SlotPicker'
import type { SelectedSlot } from './SlotPicker'
import { Field, Modal, Spinner, StarInput } from './ui'

interface ModalProps {
  appointment: Appointment | null
  onClose: () => void
  onDone: () => void
}

const CANCEL_REASONS = ['Change of plans', 'Found another doctor', 'Feeling better', 'Schedule conflict', 'Other']

export function CancelAppointmentModal({ appointment, onClose, onDone }: ModalProps) {
  const [refund, setRefund] = useState<RefundPreview | null>(null)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setReason('')
    setDetails('')
    setError('')
    if (appointment) getRefundPreview(appointment).then(setRefund)
  }, [appointment])

  const handleConfirm = async () => {
    if (!appointment || !reason) {
      setError('Please select a reason for cancelling')
      return
    }
    setBusy(true)
    try {
      await cancelAppointment(appointment.id, details ? `${reason}: ${details}` : reason)
      toast.success('Appointment cancelled')
      onDone()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={appointment !== null}
      title="Cancel appointment"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Keep appointment
          </button>
          <button type="button" className="btn-danger" disabled={busy || !reason} onClick={handleConfirm}>
            {busy && <Spinner />} Confirm cancellation
          </button>
        </>
      }
    >
      {appointment && (
        <div className="space-y-4">
          <p className="text-sm">
            Are you sure you want to cancel your appointment with <strong>{appointment.doctor.name}</strong> on{' '}
            {formatDate(appointment.date)} at {formatTime(appointment.startTime)}?
          </p>
          {refund && (
            <div className="rounded-lg bg-info-soft p-3 text-sm text-info" data-testid="refund-preview">
              <p>
                Refund amount: <strong>{formatINR(refund.amount)}</strong>
                {refund.percent > 0 && ` (${refund.percent}%)`}
              </p>
              <p className="mt-1 text-xs">{refund.note}</p>
            </div>
          )}
          <Field label="Reason for cancelling" error={error && !reason ? error : ''}>
            {(props) => (
              <select {...props} className="input" value={reason} onChange={(event) => setReason(event.target.value)}>
                <option value="">Select a reason</option>
                {CANCEL_REASONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Additional details (optional)">
            {(props) => <textarea {...props} className="input" rows={2} value={details} onChange={(event) => setDetails(event.target.value)} />}
          </Field>
          {error && reason && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

export function RescheduleModal({ appointment, onClose, onDone }: ModalProps) {
  const [selected, setSelected] = useState<SelectedSlot | null>(null)
  const [hold, setHold] = useState<Hold | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const secondsLeft = useCountdown(hold?.expiresAt)

  useEffect(() => {
    setSelected(null)
    setHold(null)
    setError('')
  }, [appointment])

  useEffect(() => {
    if (hold && secondsLeft === 0) {
      setError('Your slot hold expired. Please choose a slot again.')
      setHold(null)
      setSelected(null)
      setRefreshKey((value) => value + 1)
    }
  }, [secondsLeft, hold])

  const handleSelect = async (slot: SelectedSlot) => {
    if (!appointment) return
    setSelected(slot)
    setError('')
    try {
      setHold(
        await holdSlot({
          doctorId: appointment.doctorId,
          clinicId: appointment.clinic.id,
          mode: appointment.mode,
          date: slot.date,
          startTime: slot.startTime,
        }),
      )
    } catch (caught) {
      setHold(null)
      setSelected(null)
      setError(errorMessage(caught))
      if (errorCode(caught) === 'SLOT_TAKEN') setRefreshKey((value) => value + 1)
    }
  }

  const handleConfirm = async () => {
    if (!appointment || !selected || !hold) return
    setBusy(true)
    try {
      await rescheduleAppointment(appointment.id, selected.date, selected.startTime)
      toast.success('Appointment rescheduled')
      onDone()
    } catch (caught) {
      setError(errorMessage(caught))
      setRefreshKey((value) => value + 1)
      setSelected(null)
      setHold(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={appointment !== null}
      title="Reschedule appointment"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={!hold || busy} onClick={handleConfirm}>
            {busy && <Spinner />} Confirm new slot
          </button>
        </>
      }
    >
      {appointment && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Current: {formatDate(appointment.date)}, {formatTime(appointment.startTime)} with {appointment.doctor.name}
          </p>
          {hold && <CountdownBadge expiresAt={hold.expiresAt} label="New slot held for" />}
          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
              {error}
            </p>
          )}
          <SlotPicker
            doctorId={appointment.doctorId}
            mode={appointment.mode}
            clinicId={appointment.clinic.id}
            selected={selected}
            onSelect={handleSelect}
            refreshKey={refreshKey}
          />
        </div>
      )}
    </Modal>
  )
}

export function ReviewModal({ appointment, onClose, onDone }: ModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setRating(0)
    setComment('')
    setError('')
  }, [appointment])

  const isValid = rating > 0 && comment.trim().length >= 5

  const handleSubmit = async () => {
    if (!appointment || !isValid) {
      setError('Choose a star rating and write at least 5 characters')
      return
    }
    setBusy(true)
    try {
      await createReview(appointment.id, rating, comment.trim())
      toast.success('Thanks! Your review was submitted for moderation.')
      onDone()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={appointment !== null}
      title={`Review ${appointment?.doctor.name ?? ''}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={!isValid || busy} onClick={handleSubmit}>
            {busy && <Spinner />} Submit review
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <StarInput value={rating} onChange={setRating} />
        <Field label="Your comment" hint="At least 5 characters">
          {(props) => <textarea {...props} className="input" rows={4} value={comment} onChange={(event) => setComment(event.target.value)} />}
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

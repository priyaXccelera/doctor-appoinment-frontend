import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CalendarPlus, CheckCircle2, Copy, CreditCard, MapPin, Navigation, Pencil, Share2, Video, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { CountdownBadge } from '../components/CountdownBadge'
import { Stepper } from '../components/Stepper'
import { Avatar, Field, Skeleton, Spinner, StatusBadge } from '../components/ui'
import {
  cancelAppointment,
  confirmPayment,
  createAppointment,
  createFamilyMember,
  getAppointment,
  getDoctor,
  getFamilyMembers,
  initiatePayment,
  releaseHold,
} from '../data/store'
import { useAsync, useCountdown, useDocumentMeta } from '../hooks'
import type { Appointment } from '../types'
import { directionsUrl, downloadCalendarFile } from '../utils/calendar'
import { clearDraft, getDraft, saveDraft } from '../utils/bookingDraft'
import type { BookingDraft } from '../utils/bookingDraft'
import { errorCode, errorMessage } from '../utils/errors'
import { formatDate, formatINR, formatTime } from '../utils/format'
import { validateRequired } from '../validation'

const RELATIONS = ['Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Sibling', 'Other']

export function BookingFlow() {
  const navigate = useNavigate()
  useDocumentMeta('Book appointment')
  const [draft, setDraft] = useState<BookingDraft | null>(getDraft())
  const [step, setStep] = useState(0)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reasonTouched, setReasonTouched] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newMember, setNewMember] = useState({ name: '', dateOfBirth: '', relation: 'Spouse', gender: 'Female' })
  const [memberError, setMemberError] = useState('')
  const [simulate, setSimulate] = useState<'SUCCESS' | 'FAILED'>('SUCCESS')
  const [paymentFailed, setPaymentFailed] = useState(false)

  const doctorId = draft?.hold.doctorId ?? ''
  const doctorQuery = useAsync(() => getDoctor(doctorId), [doctorId])
  const family = useAsync(getFamilyMembers)
  const secondsLeft = useCountdown(draft?.hold.expiresAt)
  const doctor = doctorQuery.data ?? undefined

  const leaveToSlotSelection = (message: string) => {
    const current = getDraft()
    clearDraft()
    navigate(current ? `/doctors/${current.hold.doctorId}?mode=${current.hold.mode}` : '/doctors', { replace: true, state: { message } })
  }

  // Hold expiry: return to slot selection with a clear message (steps 1-4).
  useEffect(() => {
    if (draft && step < 4 && !appointment?.payAtClinic && secondsLeft === 0) {
      leaveToSlotSelection('Your slot hold expired. Please select a slot again.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, step])

  // Poll appointment status after payment until it is confirmed.
  useEffect(() => {
    if (step !== 4 || !appointment || appointment.status !== 'PENDING_PAYMENT') return undefined
    const timer = window.setInterval(() => {
      getAppointment(appointment.id).then((fresh) => fresh && setAppointment(fresh))
    }, 3000)
    return () => window.clearInterval(timer)
  }, [step, appointment])

  if (!draft) return <Navigate to="/doctors" replace />

  const updateDraft = (changes: Partial<BookingDraft>) => {
    const next = { ...draft, ...changes }
    setDraft(next)
    saveDraft(next)
  }

  const hold = draft.hold
  const fee = doctor ? (hold.mode === 'VIDEO' ? doctor.consultationFees.video : doctor.consultationFees.clinic) : 0
  const clinic = doctor?.clinics.find((item) => item.id === hold.clinicId)
  const selectedMember = family.data?.find((item) => item.id === draft.patientMemberId)
  const patientLabel = selectedMember ? `${selectedMember.name} (${selectedMember.relation})` : 'Myself'
  const canPayAtClinic = Boolean(doctor?.payAtClinic) && hold.mode === 'CLINIC'
  const reasonError = validateRequired(draft.reason, 'Reason') || (draft.reason.trim().length < 3 ? 'Describe the reason in at least 3 characters' : '')

  const changeSlot = async () => {
    await releaseHold(hold.holdId)
    leaveToSlotSelection('')
  }

  const handleAddMember = async () => {
    const nameError = validateRequired(newMember.name, 'Name')
    if (nameError || !newMember.dateOfBirth) {
      setMemberError(nameError || 'Date of birth is required')
      return
    }
    try {
      const created = await createFamilyMember(newMember)
      family.reload()
      updateDraft({ patientMemberId: created.id })
      setAdding(false)
      setMemberError('')
      setNewMember({ name: '', dateOfBirth: '', relation: 'Spouse', gender: 'Female' })
      toast.success('Family member added')
    } catch (caught) {
      setMemberError(errorMessage(caught))
    }
  }

  const goToPayment = async () => {
    setBusy(true)
    setError('')
    try {
      const created = await createAppointment({
        holdId: hold.holdId,
        patientMemberId: draft.patientMemberId,
        reason: draft.reason.trim(),
        payAtClinic: draft.payAtClinic,
      })
      setAppointment(created)
      updateDraft({ appointmentId: created.id })
      setStep(3)
    } catch (caught) {
      const code = errorCode(caught)
      if (code === 'HOLD_EXPIRED' || code === 'SLOT_TAKEN') leaveToSlotSelection(errorMessage(caught))
      else setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const finish = (confirmed: Appointment) => {
    setAppointment(confirmed)
    clearDraft()
    setStep(4)
  }

  const pay = async () => {
    if (!appointment) return
    setBusy(true)
    setError('')
    setPaymentFailed(false)
    try {
      await initiatePayment(appointment.id)
      // MOCK: simulated gateway latency
      await new Promise((resolve) => window.setTimeout(resolve, 1200))
      const result = await confirmPayment(appointment.id, simulate)
      setAppointment(result)
      if (simulate === 'SUCCESS') {
        toast.success('Payment successful')
        finish(result)
      } else {
        setPaymentFailed(true)
        setSimulate('SUCCESS')
        setError('Payment failed. Your slot is still on hold - retry before the timer ends.')
      }
    } catch (caught) {
      if (errorCode(caught) === 'HOLD_EXPIRED') leaveToSlotSelection(errorMessage(caught))
      else setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const abandonPayment = async () => {
    if (appointment) await cancelAppointment(appointment.id, 'Payment not completed').catch(() => undefined)
    leaveToSlotSelection('')
  }

  const share = async () => {
    if (!appointment) return
    const text = `Appointment ${appointment.referenceNo} with ${appointment.doctor.name} on ${formatDate(appointment.date)} at ${formatTime(appointment.startTime)}`
    if (navigator.share) {
      await navigator.share({ title: 'My appointment', text }).catch(() => undefined)
    } else {
      await navigator.clipboard?.writeText(text)
      toast.success('Appointment details copied')
    }
  }

  const summaryCard = (
    <div className="card space-y-3 p-4">
      <div className="flex items-center gap-3">
        {doctor ? <Avatar src={doctor.photoUrl} name={doctor.name} size={56} /> : <Skeleton className="h-14 w-14 rounded-full" />}
        <div>
          <p className="font-bold">{doctor?.name ?? 'Loading...'}</p>
          <p className="text-sm text-primary-text">{doctor?.specialties.join(', ')}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted">Date</dt>
        <dd className="font-medium">{formatDate(hold.date)}</dd>
        <dt className="text-muted">Time (doctor&apos;s local time)</dt>
        <dd className="font-medium">{formatTime(hold.startTime)}</dd>
        <dt className="text-muted">Mode</dt>
        <dd className="font-medium">{hold.mode === 'VIDEO' ? 'Video consultation' : 'Clinic visit'}</dd>
        {hold.mode === 'CLINIC' && clinic && (
          <>
            <dt className="text-muted">Clinic</dt>
            <dd className="font-medium">{clinic.name}, {clinic.address}</dd>
          </>
        )}
        <dt className="text-muted">Consultation fee</dt>
        <dd className="font-medium">{formatINR(fee)}</dd>
      </dl>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Stepper current={step} />
      {step < 4 && !appointment?.payAtClinic && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <CountdownBadge expiresAt={hold.expiresAt} />
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {step === 0 && (
        <section className="space-y-4" aria-label="Confirm slot">
          <h1 className="text-xl font-bold">Confirm your slot</h1>
          {summaryCard}
          <div className="flex justify-between">
            <button type="button" className="btn-ghost" onClick={changeSlot}>
              <Pencil size={16} /> Modify slot
            </button>
            <button type="button" className="btn-primary" onClick={() => setStep(1)}>
              Next
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4" aria-label="Patient and reason">
          <h1 className="text-xl font-bold">Who is this appointment for?</h1>
          <div role="radiogroup" aria-label="Patient" className="space-y-2">
            {[{ id: 'self', label: 'Myself', sub: 'Use my account details' }, ...(family.data ?? []).map((item) => ({ id: item.id, label: item.name, sub: item.relation }))].map((option) => (
              <label key={option.id} className={`card flex cursor-pointer items-center gap-3 p-3 ${draft.patientMemberId === option.id ? 'border-primary' : ''}`}>
                <input type="radio" name="patient" className="accent-primary" checked={draft.patientMemberId === option.id} onChange={() => updateDraft({ patientMemberId: option.id })} />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted">{option.sub}</span>
                </span>
              </label>
            ))}
          </div>
          {!adding ? (
            <button type="button" className="btn-outline" onClick={() => setAdding(true)}>
              + Add new family member
            </button>
          ) : (
            <div className="card grid gap-3 p-4 sm:grid-cols-2">
              <Field label="Name">
                {(props) => <input {...props} className="input" value={newMember.name} onChange={(event) => setNewMember({ ...newMember, name: event.target.value })} />}
              </Field>
              <Field label="Date of birth">
                {(props) => <input {...props} type="date" max={new Date().toISOString().slice(0, 10)} className="input" value={newMember.dateOfBirth} onChange={(event) => setNewMember({ ...newMember, dateOfBirth: event.target.value })} />}
              </Field>
              <Field label="Relation">
                {(props) => (
                  <select {...props} className="input" value={newMember.relation} onChange={(event) => setNewMember({ ...newMember, relation: event.target.value })}>
                    {RELATIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Gender">
                {(props) => (
                  <select {...props} className="input" value={newMember.gender} onChange={(event) => setNewMember({ ...newMember, gender: event.target.value })}>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                )}
              </Field>
              {memberError && <p role="alert" className="text-sm text-danger sm:col-span-2">{memberError}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" className="btn-primary" onClick={handleAddMember}>Save member</button>
                <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </div>
          )}
          <Field label="Reason or symptoms" error={reasonTouched ? reasonError : ''} hint="Briefly describe why you want to see the doctor">
            {(props) => (
              <textarea {...props} className="input" rows={3} value={draft.reason} onBlur={() => setReasonTouched(true)} onChange={(event) => updateDraft({ reason: event.target.value })} />
            )}
          </Field>
          <div className="flex justify-between">
            <button type="button" className="btn-ghost" onClick={() => setStep(0)}>Previous</button>
            <button
              type="button"
              className="btn-primary"
              disabled={Boolean(reasonError)}
              onClick={() => {
                setReasonTouched(true)
                if (!reasonError) setStep(2)
              }}
            >
              Next
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4" aria-label="Review summary">
          <h1 className="text-xl font-bold">Review your appointment</h1>
          {summaryCard}
          <div className="card space-y-2 p-4 text-sm">
            <p><span className="text-muted">Patient:</span> <strong>{patientLabel}</strong></p>
            <p><span className="text-muted">Reason:</span> {draft.reason}</p>
            <div className="mt-2 border-t border-line pt-2">
              <div className="flex justify-between"><span>Consultation fee</span><span>{formatINR(fee)}</span></div>
              <div className="flex justify-between"><span>Booking fee</span><span>{formatINR(0)}</span></div>
              <div className="mt-1 flex justify-between text-base font-bold"><span>Total</span><span>{formatINR(fee)}</span></div>
            </div>
          </div>
          <fieldset className="card space-y-2 p-4">
            <legend className="px-1 text-sm font-semibold">Payment method</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="pay" className="accent-primary" checked={!draft.payAtClinic} onChange={() => updateDraft({ payAtClinic: false })} />
              Pay online now
            </label>
            <label className={`flex items-center gap-2 text-sm ${canPayAtClinic ? '' : 'opacity-50'}`}>
              <input type="radio" name="pay" className="accent-primary" disabled={!canPayAtClinic} checked={draft.payAtClinic} onChange={() => updateDraft({ payAtClinic: true })} />
              Pay at clinic {!canPayAtClinic && '(not available for this booking)'}
            </label>
          </fieldset>
          <div className="flex justify-between">
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Previous</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={goToPayment}>
              {busy && <Spinner />} Next
            </button>
          </div>
        </section>
      )}

      {step === 3 && appointment && (
        <section className="space-y-4" aria-label="Payment">
          <h1 className="text-xl font-bold">Payment</h1>
          {appointment.payAtClinic ? (
            <div className="card space-y-3 p-4">
              <p className="text-sm">You chose to pay at the clinic. Your slot is confirmed - pay <strong>{formatINR(appointment.fee)}</strong> at the front desk.</p>
              <button type="button" className="btn-primary" onClick={() => finish(appointment)}>
                Confirm booking
              </button>
            </div>
          ) : (
            <div className="card space-y-4 p-4">
              <p className="flex items-center justify-between text-lg font-bold">
                <span>Amount payable</span>
                <span>{formatINR(appointment.fee)}</span>
              </p>
              {/* MOCK: demo payment gateway - choose the outcome to simulate */}
              <fieldset className="space-y-2 rounded-lg bg-warn-soft p-3 text-sm text-warn">
                <legend className="px-1 font-semibold">Mock payment gateway (demo)</legend>
                <label className="flex items-center gap-2">
                  <input type="radio" name="simulate" checked={simulate === 'SUCCESS'} onChange={() => setSimulate('SUCCESS')} /> Simulate successful payment
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="simulate" checked={simulate === 'FAILED'} onChange={() => setSimulate('FAILED')} /> Simulate failed payment
                </label>
              </fieldset>
              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" className="btn-ghost" disabled={busy} onClick={abandonPayment}>
                  Change slot
                </button>
                <button type="button" className="btn-primary" disabled={busy} onClick={pay}>
                  {busy ? <Spinner /> : <CreditCard size={16} />} {paymentFailed ? 'Retry payment' : 'Pay now'}
                </button>
              </div>
              {busy && <p role="status" className="text-sm text-muted">Processing payment...</p>}
            </div>
          )}
        </section>
      )}

      {step === 4 && appointment && (
        <section className="space-y-4" aria-label="Confirmation">
          <div className="card flex flex-col items-center gap-2 p-6 text-center">
            <CheckCircle2 size={48} className="text-success" aria-hidden="true" />
            <h1 className="text-2xl font-bold">Appointment booked!</h1>
            <p className="text-sm text-muted">Reference number</p>
            <p className="flex items-center gap-2 text-xl font-bold tracking-wider">
              {appointment.referenceNo}
              <button type="button" aria-label="Copy reference number" onClick={() => navigator.clipboard?.writeText(appointment.referenceNo)}>
                <Copy size={16} />
              </button>
            </p>
            <StatusBadge status={appointment.status} />
          </div>
          <div className="card space-y-1 p-4 text-sm">
            <p><strong>{appointment.doctor.name}</strong> · {appointment.doctor.specialties.join(', ')}</p>
            <p>{formatDate(appointment.date)}, {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)} (doctor&apos;s local time)</p>
            <p>Patient: {appointment.patient.name}</p>
            <p>Fee: {formatINR(appointment.fee)} · Payment: <StatusBadge status={appointment.paymentStatus} /></p>
            {appointment.mode === 'CLINIC' ? (
              <p className="flex items-center gap-1"><MapPin size={14} /> {appointment.clinic.name}, {appointment.clinic.address}</p>
            ) : (
              <p className="flex items-center gap-1"><Video size={14} /> A secure video link will be enabled in My appointments 15 minutes before your slot.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline" onClick={() => downloadCalendarFile(appointment)}>
              <CalendarPlus size={16} /> Add to calendar
            </button>
            {appointment.mode === 'CLINIC' && (
              <a className="btn-outline" href={directionsUrl(appointment.clinic.address)} target="_blank" rel="noreferrer">
                <Navigation size={16} /> Directions
              </a>
            )}
            <button type="button" className="btn-outline" onClick={share}>
              <Share2 size={16} /> Share
            </button>
            <Link to="/appointments" className="btn-primary ml-auto">
              Back to appointments
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

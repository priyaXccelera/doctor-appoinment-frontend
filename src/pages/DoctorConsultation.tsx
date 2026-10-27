import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Plus, Trash2, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState, ErrorState, Field, Skeleton, Spinner, StatusBadge } from '../components/ui'
import { addAppointmentNote, getDoctorAppointment, issuePrescription, updateAppointmentStatus } from '../data/doctorStore'
import { getPrescription, getVideoLink } from '../data/store'
import { useAsync, useDocumentMeta, useUnsavedWarning } from '../hooks'
import { errorMessage } from '../utils/errors'
import { formatDate, formatTime } from '../utils/format'
import { validatePrescription } from '../validation'
import type { MedicineInput } from '../validation'

const MEDICINE_SUGGESTIONS = ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Cetirizine 10mg', 'Ibuprofen 400mg', 'Pantoprazole 40mg', 'Metformin 500mg', 'Azithromycin 500mg', 'ORS sachet']
const FREQUENCIES = ['Once a day', 'Twice a day', 'Thrice a day', 'Once at night', 'As needed']
const blankMedicine = (): MedicineInput => ({ name: '', dosage: '', frequency: 'Twice a day', duration: '', instructions: '' })

export function DoctorConsultation() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  useDocumentMeta('Consultation')
  const { data: appointment, loading, error, reload } = useAsync(() => getDoctorAppointment(id), [id])
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<MedicineInput[]>([blankMedicine()])
  const [tests, setTests] = useState('')
  const [advice, setAdvice] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useUnsavedWarning(dirty)

  useEffect(() => {
    if (appointment) setNotes(appointment.notes)
  }, [appointment])

  const existingRx = useAsync(async () => (appointment?.prescriptionId ? getPrescription(appointment.prescriptionId) : undefined), [appointment?.prescriptionId])

  const input = { diagnosis, medicines, tests, advice, followUpDate }
  const errors = validatePrescription(input)
  const isValid = Object.keys(errors).length === 0

  const updateMedicine = (index: number, changes: Partial<MedicineInput>) => {
    setMedicines(medicines.map((item, position) => (position === index ? { ...item, ...changes } : item)))
    setDirty(true)
  }

  const saveNotes = async () => {
    try {
      await addAppointmentNote(id, notes)
      toast.success('Notes saved')
      setDirty(false)
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
  }

  const issue = async () => {
    setSubmitted(true)
    if (!isValid) return
    setSaving(true)
    try {
      await issuePrescription(id, {
        diagnosis: diagnosis.trim(),
        medicines,
        tests: tests.split(',').map((item) => item.trim()).filter(Boolean),
        advice,
        followUpDate,
      })
      setDirty(false)
      toast.success('Prescription issued')
      reload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const start = async () => {
    await updateAppointmentStatus(id, 'IN_PROGRESS')
    reload()
  }

  const complete = async () => {
    await updateAppointmentStatus(id, 'COMPLETED')
    toast.success('Consultation completed')
    navigate('/doctor/appointments')
  }

  const joinVideo = async () => window.open(await getVideoLink(id), '_blank', 'noopener')

  if (loading) return <Skeleton className="h-96 w-full" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!appointment) return <EmptyState title="Appointment not found" action={<Link to="/doctor/appointments" className="btn-primary">Back</Link>} />

  const readOnly = Boolean(appointment.prescriptionId)

  return (
    <div className="space-y-6">
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
      <section className="card flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h1 className="text-xl font-bold">{appointment.patient.name}</h1>
          <p className="text-sm text-muted">{appointment.patientInfo.age} yrs · {appointment.patientInfo.gender} · Allergies: {appointment.patientInfo.allergies} · Conditions: {appointment.patientInfo.conditions}</p>
          <p className="mt-1 text-sm">{formatDate(appointment.date)}, {formatTime(appointment.startTime)} · {appointment.mode === 'VIDEO' ? 'Video consult' : appointment.clinic.name}</p>
          <p className="text-sm">Reason: {appointment.reason}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={appointment.status} />
          {appointment.mode === 'VIDEO' && ['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status) && (
            <button type="button" className="btn-outline" onClick={joinVideo}><Video size={16} /> Join video</button>
          )}
          {appointment.status === 'CONFIRMED' && <button type="button" className="btn-primary" onClick={start}>Start consultation</button>}
          {appointment.status === 'IN_PROGRESS' && <button type="button" className="btn-primary" onClick={complete}>Complete consultation</button>}
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Consultation notes</h2>
        <Field label="Notes">
          {(props) => <textarea {...props} className="input" rows={4} value={notes} onChange={(event) => { setNotes(event.target.value); setDirty(true) }} />}
        </Field>
        <button type="button" className="btn-outline" onClick={saveNotes}>Save notes</button>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Prescription</h2>
        {readOnly && existingRx.data ? (
          <div className="space-y-2 text-sm">
            <p className="rounded-lg bg-success-soft p-3 text-success">A prescription has been issued for this appointment.</p>
            <p><strong>Diagnosis:</strong> {existingRx.data.diagnosis}</p>
            <ul className="list-inside list-disc">{existingRx.data.medicines.map((medicine, index) => <li key={index}>{medicine.name} - {medicine.dosage}, {medicine.frequency}, {medicine.duration}</li>)}</ul>
          </div>
        ) : (
          <>
            <Field label="Diagnosis" error={submitted ? errors.diagnosis : ''}>
              {(props) => <input {...props} className="input" value={diagnosis} onChange={(event) => { setDiagnosis(event.target.value); setDirty(true) }} />}
            </Field>
            <datalist id="medicine-options">{MEDICINE_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            {submitted && errors.medicines && <p role="alert" className="text-sm text-danger">{errors.medicines}</p>}
            {medicines.map((medicine, index) => (
              <fieldset key={index} className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-2">
                <legend className="px-1 text-xs font-semibold text-muted">Medicine {index + 1}</legend>
                <Field label="Medicine" error={submitted ? errors[`medicine-${index}-name`] : ''}>
                  {(props) => <input {...props} list="medicine-options" className="input" value={medicine.name} onChange={(event) => updateMedicine(index, { name: event.target.value })} />}
                </Field>
                <Field label="Dosage" error={submitted ? errors[`medicine-${index}-dosage`] : ''}>
                  {(props) => <input {...props} className="input" placeholder="1 tablet" value={medicine.dosage} onChange={(event) => updateMedicine(index, { dosage: event.target.value })} />}
                </Field>
                <Field label="Frequency" error={submitted ? errors[`medicine-${index}-frequency`] : ''}>
                  {(props) => (
                    <select {...props} className="input" value={medicine.frequency} onChange={(event) => updateMedicine(index, { frequency: event.target.value })}>
                      {FREQUENCIES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="Duration" error={submitted ? errors[`medicine-${index}-duration`] : ''}>
                  {(props) => <input {...props} className="input" placeholder="5 days" value={medicine.duration} onChange={(event) => updateMedicine(index, { duration: event.target.value })} />}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Instructions">
                    {(props) => <input {...props} className="input" value={medicine.instructions} onChange={(event) => updateMedicine(index, { instructions: event.target.value })} />}
                  </Field>
                </div>
                <button type="button" className="btn-danger w-fit" onClick={() => { setMedicines(medicines.filter((_, position) => position !== index)); setDirty(true) }}>
                  <Trash2 size={14} /> Remove medicine
                </button>
              </fieldset>
            ))}
            <button type="button" className="btn-outline" onClick={() => setMedicines([...medicines, blankMedicine()])}><Plus size={16} /> Add medicine</button>
            <Field label="Tests" hint="Comma separated, e.g. CBC, Lipid profile">
              {(props) => <input {...props} className="input" value={tests} onChange={(event) => { setTests(event.target.value); setDirty(true) }} />}
            </Field>
            <Field label="Advice">
              {(props) => <textarea {...props} className="input" rows={2} value={advice} onChange={(event) => { setAdvice(event.target.value); setDirty(true) }} />}
            </Field>
            <Field label="Follow-up date">
              {(props) => <input {...props} type="date" className="input" value={followUpDate} onChange={(event) => { setFollowUpDate(event.target.value); setDirty(true) }} />}
            </Field>
            {preview && (
              <div className="rounded-lg bg-primary-soft p-4 text-sm" aria-label="Prescription preview">
                <p className="font-bold">Preview</p>
                <p>Diagnosis: {diagnosis || '-'}</p>
                <ul className="list-inside list-disc">{medicines.map((medicine, index) => <li key={index}>{medicine.name || '(unnamed)'} - {medicine.dosage}, {medicine.frequency}, {medicine.duration}</li>)}</ul>
                <p>Tests: {tests || 'None'}</p>
                <p>Advice: {advice || 'None'}</p>
                <p>Follow-up: {followUpDate ? formatDate(followUpDate) : 'Not required'}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setPreview((value) => !value)}><Eye size={16} /> {preview ? 'Hide preview' : 'Preview'}</button>
              <button type="button" className="btn-primary" disabled={saving} onClick={issue}>{saving && <Spinner />} Save &amp; issue prescription</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

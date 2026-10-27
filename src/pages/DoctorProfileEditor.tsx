import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, ErrorState, Field, PageHeader, Skeleton, Spinner } from '../components/ui'
import { getDoctorProfile, updateDoctorProfile, uploadDoctorDocument } from '../data/doctorStore'
import { useAsync, useDocumentMeta, useUnsavedWarning } from '../hooks'
import type { Doctor } from '../types'
import { errorMessage } from '../utils/errors'
import { validateRequired } from '../validation'
import { StatusBadge } from '../components/ui'

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu']

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    if (!draft.trim()) return
    onChange([...items, draft.trim()])
    setDraft('')
  }
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <ul className="mb-2 space-y-1">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-center gap-2">
            <input aria-label={`${label} ${index + 1}`} className="input" value={item} onChange={(event) => onChange(items.map((entry, position) => (position === index ? event.target.value : entry)))} />
            <button type="button" className="btn-danger" aria-label={`Delete ${item}`} onClick={() => onChange(items.filter((_, position) => position !== index))}><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input aria-label={`New ${label}`} className="input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add() } }} />
        <button type="button" className="btn-outline" onClick={add}><Plus size={14} /> Add</button>
      </div>
    </div>
  )
}

export function DoctorProfileEditor() {
  useDocumentMeta('Doctor profile')
  const { data, loading, error, reload } = useAsync(getDoctorProfile)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [dirty, setDirty] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clinicDraft, setClinicDraft] = useState({ name: '', address: '', locality: '', city: '' })
  const fileRef = useRef<HTMLInputElement>(null)
  useUnsavedWarning(dirty)

  useEffect(() => {
    if (data) setDoctor(data)
  }, [data])

  if (loading || !doctor) return error ? <ErrorState message={error} onRetry={reload} /> : <Skeleton className="h-96 w-full" />

  const change = (changes: Partial<Doctor>) => {
    setDoctor({ ...doctor, ...changes })
    setDirty(true)
  }
  const errors = {
    about: validateRequired(doctor.about, 'About'),
    fees: doctor.consultationFees.clinic > 0 && doctor.consultationFees.video > 0 ? '' : 'Fees must be greater than 0',
  }

  const save = async () => {
    setSubmitted(true)
    if (errors.about || errors.fees) return
    setSaving(true)
    try {
      await updateDoctorProfile(doctor)
      setDirty(false)
      toast.success('Profile saved')
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const handlePhoto = (file: File | undefined) => {
    if (!file) return
    if (file.size > 500 * 1024) {
      toast.error('Photo must be 500 KB or smaller')
      return
    }
    const reader = new FileReader()
    reader.onload = () => change({ photoUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      const updated = await uploadDoctorDocument(file.name)
      setDoctor(updated)
      toast.success('Document uploaded - verification pending')
    } catch (caught) {
      toast.error(errorMessage(caught))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const addClinic = () => {
    if (!clinicDraft.name.trim() || !clinicDraft.address.trim() || !clinicDraft.city.trim()) {
      toast.error('Clinic name, address and city are required')
      return
    }
    change({
      clinics: [
        ...doctor.clinics,
        // MOCK: coordinates are placeholders until geocoding exists
        { id: `c-${Date.now()}`, ...clinicDraft, lat: 12.9716, lng: 77.5946, photos: [] },
      ],
    })
    setClinicDraft({ name: '', address: '', locality: '', city: '' })
  }

  const bannerTone = doctor.verification === 'VERIFIED' ? 'bg-success-soft text-success' : doctor.verification === 'REJECTED' || doctor.verification === 'SUSPENDED' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Profile" actions={<button type="button" className="btn-primary" disabled={saving || !dirty} onClick={save}>{saving && <Spinner />} Save profile</button>} />

      <div role="status" className={`flex flex-wrap items-center gap-2 rounded-lg p-4 text-sm ${bannerTone}`}>
        <StatusBadge status={doctor.verification} />
        {doctor.verification === 'VERIFIED' && 'Your profile is verified and visible to patients.'}
        {doctor.verification === 'PENDING' && 'Your documents are under review. You will appear in search once verified.'}
        {doctor.verification === 'REJECTED' && `Verification rejected: ${doctor.verificationReason ?? 'no reason provided'}. Upload corrected documents.`}
        {doctor.verification === 'SUSPENDED' && `Your account is suspended: ${doctor.verificationReason ?? 'contact support'}.`}
      </div>

      <section className="card space-y-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar src={doctor.photoUrl} name={doctor.name} size={72} />
          <Field label="Photo" hint="PNG or JPG, up to 500 KB">{(props) => <input {...props} type="file" accept="image/*" className="text-sm" onChange={(event) => handlePhoto(event.target.files?.[0])} />}</Field>
        </div>
        <Field label="About" error={submitted ? errors.about : ''}>
          {(props) => <textarea {...props} className="input" rows={4} value={doctor.about} onChange={(event) => change({ about: event.target.value })} />}
        </Field>
        <StringList label="Qualification" items={doctor.qualifications} onChange={(items) => change({ qualifications: items })} />
        <StringList label="Service" items={doctor.services} onChange={(items) => change({ services: items })} />
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Fees (INR)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Clinic visit fee" error={submitted ? errors.fees : ''}>{(props) => <input {...props} type="number" min={1} className="input" value={doctor.consultationFees.clinic} onChange={(event) => change({ consultationFees: { ...doctor.consultationFees, clinic: Number(event.target.value) } })} />}</Field>
          <Field label="Video consult fee">{(props) => <input {...props} type="number" min={1} className="input" value={doctor.consultationFees.video} onChange={(event) => change({ consultationFees: { ...doctor.consultationFees, video: Number(event.target.value) } })} />}</Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={doctor.payAtClinic} onChange={(event) => change({ payAtClinic: event.target.checked })} /> Allow pay at clinic</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={doctor.manualApproval} onChange={(event) => change({ manualApproval: event.target.checked })} /> Require manual approval of appointments</label>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Clinics</h2>
        {doctor.clinics.length === 0 && <p className="text-sm text-muted">No clinics added yet.</p>}
        <ul className="divide-y divide-line">
          {doctor.clinics.map((clinic) => (
            <li key={clinic.id} className="flex items-center justify-between py-2 text-sm">
              <span><strong>{clinic.name}</strong> · {clinic.address}</span>
              <button type="button" className="btn-danger" aria-label={`Remove ${clinic.name}`} onClick={() => change({ clinics: doctor.clinics.filter((item) => item.id !== clinic.id) })}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-2">
          <input aria-label="Clinic name" placeholder="Clinic name" className="input" value={clinicDraft.name} onChange={(event) => setClinicDraft({ ...clinicDraft, name: event.target.value })} />
          <input aria-label="Clinic address" placeholder="Address" className="input" value={clinicDraft.address} onChange={(event) => setClinicDraft({ ...clinicDraft, address: event.target.value })} />
          <input aria-label="Clinic locality" placeholder="Locality" className="input" value={clinicDraft.locality} onChange={(event) => setClinicDraft({ ...clinicDraft, locality: event.target.value })} />
          <input aria-label="Clinic city" placeholder="City" className="input" value={clinicDraft.city} onChange={(event) => setClinicDraft({ ...clinicDraft, city: event.target.value })} />
        </div>
        <button type="button" className="btn-outline" onClick={addClinic}><Plus size={14} /> Add clinic</button>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">Languages</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((language) => {
            const active = doctor.languages.includes(language)
            return (
              <button key={language} type="button" aria-pressed={active} onClick={() => change({ languages: active ? doctor.languages.filter((item) => item !== language) : [...doctor.languages, language] })} className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-primary bg-primary text-white' : 'border-line'}`}>
                {language}
              </button>
            )
          })}
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-bold">Verification documents</h2>
        <ul className="text-sm">{doctor.documents.map((item) => <li key={item}>{item}</li>)}</ul>
        <Field label="Upload a document" hint="Registration certificate or degree (PDF/image)">
          {(props) => <input {...props} ref={fileRef} type="file" accept="image/*,application/pdf" className="text-sm" onChange={(event) => upload(event.target.files?.[0])} />}
        </Field>
        <p className="flex items-center gap-1 text-xs text-muted"><Upload size={12} /> Uploading a new document resets verification to pending.</p>
      </section>
    </div>
  )
}

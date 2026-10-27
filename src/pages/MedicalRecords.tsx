import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, FileText, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { ConfirmDialog, EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Pagination, Spinner, paginate } from '../components/ui'
import { createMedicalRecord, deleteMedicalRecord, getMedicalRecords } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { MedicalRecord } from '../types'
import { errorMessage } from '../utils/errors'
import { formatDate, todayISO } from '../utils/format'

const RECORD_TYPES = ['Lab report', 'Prescription', 'Scan / imaging', 'Discharge summary', 'Insurance', 'Other']
const MAX_BYTES = 2 * 1024 * 1024
const PAGE_SIZE = 5

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}

export function MedicalRecords() {
  useDocumentMeta('Medical records')
  const { data, loading, error, reload } = useAsync(getMedicalRecords)
  const [file, setFile] = useState<File | null>(null)
  const [recordType, setRecordType] = useState(RECORD_TYPES[0])
  const [date, setDate] = useState(todayISO())
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')
  const [preview, setPreview] = useState<MedicalRecord | null>(null)
  const [toDelete, setToDelete] = useState<MedicalRecord | null>(null)
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  const fileError = !file ? 'Choose a file to upload' : file.size > MAX_BYTES ? 'File must be 2 MB or smaller' : ''
  const isValid = !fileError && Boolean(date)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!isValid || !file) return
    setUploading(true)
    setFormError('')
    try {
      const dataUrl = await readAsDataUrl(file)
      await createMedicalRecord({ fileName: file.name, fileType: file.type, size: file.size, recordType, date, dataUrl })
      toast.success('Record uploaded')
      setFile(null)
      setSubmitted(false)
      if (inputRef.current) inputRef.current.value = ''
      reload()
    } catch (caught) {
      setFormError(errorMessage(caught))
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteMedicalRecord(toDelete.id)
      toast.success('Record deleted')
      setToDelete(null)
      reload()
    } catch (caught) {
      setFormError(errorMessage(caught))
    }
  }

  const records = data ?? []

  return (
    <div>
      <PageHeader title="Medical records" subtitle="Upload reports so your doctors can review them." />
      <form onSubmit={handleSubmit} noValidate className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
        <Field label="File" error={submitted ? fileError : ''} hint="PDF or image, up to 2 MB">
          {(props) => <input {...props} ref={inputRef} type="file" accept="image/*,application/pdf" className="input" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />}
        </Field>
        <Field label="Record type">
          {(props) => (
            <select {...props} className="input" value={recordType} onChange={(event) => setRecordType(event.target.value)}>
              {RECORD_TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}
        </Field>
        <Field label="Date" error={submitted && !date ? 'Date is required' : ''}>
          {(props) => <input {...props} type="date" max={todayISO()} className="input" value={date} onChange={(event) => setDate(event.target.value)} />}
        </Field>
        <div className="flex items-start pt-6">
          <button type="submit" className="btn-primary w-full" disabled={uploading}>
            {uploading ? <Spinner /> : <Upload size={16} />} Upload
          </button>
        </div>
        {formError && <p role="alert" className="text-sm text-danger sm:col-span-4">{formError}</p>}
      </form>

      {loading && <ListSkeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && records.length === 0 && <EmptyState title="No records uploaded" hint="Upload a lab report or scan to get started." />}
      <div className="space-y-3">
        {paginate(records, page, PAGE_SIZE).map((record) => (
          <article key={record.id} className="card flex items-center gap-3 p-3">
            {record.fileType.startsWith('image/') ? (
              <img src={record.dataUrl} alt={`${record.recordType} preview`} className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-soft text-primary-text"><FileText /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{record.fileName}</p>
              <p className="text-xs text-muted">{record.recordType} · {formatDate(record.date)} · {(record.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setPreview(record)} aria-label={`Preview ${record.fileName}`}><Eye size={16} /></button>
            <button type="button" className="btn-danger" onClick={() => setToDelete(record)} aria-label={`Delete ${record.fileName}`}><Trash2 size={16} /></button>
          </article>
        ))}
      </div>
      <Pagination page={page} total={records.length} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={preview !== null} title={preview?.fileName ?? 'Preview'} onClose={() => setPreview(null)} wide>
        {preview && (preview.fileType.startsWith('image/') ? (
          <img src={preview.dataUrl} alt={preview.fileName} className="mx-auto max-h-[60vh]" />
        ) : (
          <iframe title={preview.fileName} src={preview.dataUrl} className="h-[60vh] w-full" />
        ))}
      </Modal>
      <ConfirmDialog open={toDelete !== null} title="Delete record?" message={`This permanently removes ${toDelete?.fileName ?? 'this record'}.`} confirmLabel="Delete" danger onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  )
}

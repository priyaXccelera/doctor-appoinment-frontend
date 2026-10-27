import { useState } from 'react'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Pagination, Spinner, StatusBadge, Tabs, paginate } from '../components/ui'
import { getAdminDoctors, setDoctorVerification } from '../data/adminStore'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Doctor, VerificationStatus } from '../types'
import { errorMessage } from '../utils/errors'

type Filter = VerificationStatus | 'ALL'
const PAGE_SIZE = 5

export function AdminVerification() {
  useDocumentMeta('Doctor verification')
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => getAdminDoctors(filter === 'ALL' ? undefined : filter), [filter])
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [action, setAction] = useState<{ status: VerificationStatus; label: string } | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [busy, setBusy] = useState(false)
  const items = data ?? []

  const run = async (status: VerificationStatus, note = '') => {
    if (!selected) return
    setBusy(true)
    try {
      await setDoctorVerification(selected.id, status, note)
      toast.success(`Doctor ${status.toLowerCase()}`)
      setAction(null)
      setSelected(null)
      setReason('')
      reload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const confirmAction = () => {
    if (!action) return
    if (!reason.trim()) {
      setReasonError('A reason is required')
      return
    }
    setReasonError('')
    run(action.status, reason.trim())
  }

  return (
    <div>
      <PageHeader title="Doctor verification" />
      <Tabs
        tabs={(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'ALL'] as Filter[]).map((id) => ({ id, label: id === 'ALL' ? 'All' : id.charAt(0) + id.slice(1).toLowerCase() }))}
        active={filter}
        onChange={(id) => { setFilter(id); setPage(1) }}
      />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No doctors in this status" />}
      <div className="space-y-2">
        {paginate(items, page, PAGE_SIZE).map((doctor) => (
          <button key={doctor.id} type="button" onClick={() => setSelected(doctor)} className="card flex w-full items-center gap-3 p-3 text-left hover:border-primary">
            <Avatar src={doctor.photoUrl} name={doctor.name} size={48} />
            <span className="flex-1">
              <span className="block font-semibold">{doctor.name}</span>
              <span className="block text-xs text-muted">{doctor.specialties.join(', ')} · Reg. {doctor.registrationNo || 'not provided'}</span>
            </span>
            <StatusBadge status={doctor.verification} />
          </button>
        ))}
      </div>
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={selected !== null && action === null} title="Review doctor" onClose={() => setSelected(null)} wide>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar src={selected.photoUrl} name={selected.name} size={64} />
              <div>
                <p className="text-lg font-bold">{selected.name}</p>
                <p className="text-muted">{selected.qualifications.join(', ')} · {selected.experienceYears} yrs</p>
                <p className="text-muted">Registration {selected.registrationNo || '-'} ({selected.council || '-'})</p>
              </div>
              <span className="ml-auto"><StatusBadge status={selected.verification} /></span>
            </div>
            {selected.verificationReason && <p className="rounded-lg bg-neutral-soft p-2">Last reason: {selected.verificationReason}</p>}
            <div>
              <h3 className="mb-2 font-semibold">Documents</h3>
              {selected.documents.length === 0 && <p className="text-muted">No documents uploaded.</p>}
              <div className="grid gap-2 sm:grid-cols-2">
                {selected.documents.map((document) => (
                  // MOCK: placeholder document viewer; real files come from the backend
                  <div key={document} className="flex h-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-canvas text-muted">
                    <FileText aria-hidden="true" />
                    <span>{document}</span>
                    <span className="text-xs">Preview unavailable in demo mode</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-primary" disabled={busy || selected.verification === 'VERIFIED'} onClick={() => run('VERIFIED')}>{busy && <Spinner />} Approve</button>
              <button type="button" className="btn-danger" onClick={() => { setAction({ status: 'REJECTED', label: 'Reject' }); setReason('') }}>Reject</button>
              <button type="button" className="btn-ghost" onClick={() => { setAction({ status: 'SUSPENDED', label: 'Suspend' }); setReason('') }}>Suspend</button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={action !== null}
        title={`${action?.label ?? ''} doctor`}
        onClose={() => setAction(null)}
        footer={<><button type="button" className="btn-ghost" onClick={() => setAction(null)}>Back</button><button type="button" className="btn-danger" disabled={busy} onClick={confirmAction}>{busy && <Spinner />} Confirm</button></>}
      >
        <Field label="Reason (shown to the doctor)" error={reasonError}>
          {(props) => <textarea {...props} className="input" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}
        </Field>
      </Modal>
    </div>
  )
}

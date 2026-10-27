import { useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Pagination, Spinner, Stars, StatusBadge, Tabs, paginate } from '../components/ui'
import { getModerationReviews, moderateReview } from '../data/adminStore'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Review } from '../types'
import { formatDate } from '../utils/format'

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED'
const PAGE_SIZE = 5

export function AdminReviews() {
  useDocumentMeta('Review moderation')
  const { data, loading, error, reload } = useAsync(getModerationReviews)
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<Review | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [saving, setSaving] = useState(false)
  const items = (data ?? []).filter((review) => review.moderation === filter)

  const approve = async (review: Review) => {
    await moderateReview(review.id, 'APPROVE')
    toast.success('Review approved')
    reload()
  }

  const reject = async () => {
    if (!target) return
    if (!reason.trim()) {
      setReasonError('A reason is required')
      return
    }
    setSaving(true)
    try {
      await moderateReview(target.id, 'REJECT', reason.trim())
      toast.success('Review rejected')
      setTarget(null)
      setReason('')
      reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Review moderation" />
      <Tabs tabs={[{ id: 'PENDING', label: 'Pending' }, { id: 'APPROVED', label: 'Approved' }, { id: 'REJECTED', label: 'Rejected' }]} active={filter} onChange={(id) => { setFilter(id); setPage(1) }} />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title={`No ${filter.toLowerCase()} reviews`} />}
      <div className="space-y-3">
        {paginate(items, page, PAGE_SIZE).map((review) => (
          <article key={review.id} className="card space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{review.patientName} → {review.doctorName}</p>
              <span className="flex items-center gap-2 text-xs text-muted">{formatDate(review.date)} <StatusBadge status={review.moderation} /></span>
            </div>
            <Stars value={review.rating} size={14} />
            <p className="text-sm">{review.comment}</p>
            {review.moderation === 'PENDING' && (
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={() => approve(review)}>Approve</button>
                <button type="button" className="btn-danger" onClick={() => { setTarget(review); setReason(''); setReasonError('') }}>Reject</button>
              </div>
            )}
          </article>
        ))}
      </div>
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <Modal open={target !== null} title="Reject review" onClose={() => setTarget(null)} footer={<><button type="button" className="btn-ghost" onClick={() => setTarget(null)}>Cancel</button><button type="button" className="btn-danger" disabled={saving} onClick={reject}>{saving && <Spinner />} Reject review</button></>}>
        <Field label="Reason" error={reasonError}>{(props) => <textarea {...props} className="input" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}</Field>
      </Modal>
    </div>
  )
}

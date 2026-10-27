import { useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Pagination, Spinner, Stars, paginate } from '../components/ui'
import { getMyReviews, replyToReview } from '../data/doctorStore'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Review } from '../types'
import { errorMessage } from '../utils/errors'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 5

export function DoctorReviews() {
  useDocumentMeta('Reviews')
  const { data, loading, error, reload } = useAsync(getMyReviews)
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<Review | null>(null)
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState('')
  const [saving, setSaving] = useState(false)
  const items = data ?? []

  const open = (review: Review) => {
    setTarget(review)
    setReply(review.reply)
    setReplyError('')
  }

  const submit = async () => {
    if (!target) return
    if (reply.trim().length < 3) {
      setReplyError('Reply must be at least 3 characters')
      return
    }
    setSaving(true)
    try {
      await replyToReview(target.id, reply.trim())
      toast.success('Reply posted')
      setTarget(null)
      reload()
    } catch (caught) {
      setReplyError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Reviews" />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No reviews yet" />}
      <div className="space-y-3">
        {paginate(items, page, PAGE_SIZE).map((review) => (
          <article key={review.id} className="card space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{review.patientName}</p>
              <span className="text-xs text-muted">{formatDate(review.date)}</span>
            </div>
            <Stars value={review.rating} size={14} />
            <p className="text-sm">{review.comment}</p>
            {review.reply ? <p className="rounded-lg bg-primary-soft p-3 text-sm"><strong>Your reply:</strong> {review.reply}</p> : <p className="text-xs text-warn">Awaiting your reply</p>}
            <button type="button" className="btn-outline" onClick={() => open(review)}>{review.reply ? 'Edit reply' : 'Reply'}</button>
          </article>
        ))}
      </div>
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <Modal
        open={target !== null}
        title="Reply to review"
        onClose={() => setTarget(null)}
        footer={<><button type="button" className="btn-ghost" onClick={() => setTarget(null)}>Cancel</button><button type="button" className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />} Post reply</button></>}
      >
        <p className="mb-3 text-sm text-muted">{target?.comment}</p>
        <Field label="Your reply" error={replyError}>
          {(props) => <textarea {...props} className="input" rows={4} value={reply} onChange={(event) => setReply(event.target.value)} />}
        </Field>
      </Modal>
    </div>
  )
}

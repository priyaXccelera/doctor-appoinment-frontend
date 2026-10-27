import { useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState, ErrorState, Field, ListSkeleton, Modal, PageHeader, Pagination, Spinner, StatusBadge, paginate } from '../components/ui'
import { getRefunds, updateRefund } from '../data/adminStore'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Refund } from '../types'
import { errorMessage } from '../utils/errors'
import { formatINR } from '../utils/format'

const PAGE_SIZE = 6

export function AdminRefunds() {
  useDocumentMeta('Refunds & disputes')
  const { data, loading, error, reload } = useAsync(getRefunds)
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<{ refund: Refund; action: 'APPROVE' | 'PROCESS' } | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const items = data ?? []

  const amountNumber = Number(amount)
  const amountError = !amount || Number.isNaN(amountNumber) || amountNumber <= 0 ? 'Enter an amount greater than 0' : ''
  const reasonError = reason.trim() ? '' : 'Reason is required'

  const open = (refund: Refund, action: 'APPROVE' | 'PROCESS') => {
    setTarget({ refund, action })
    setAmount(String(refund.amount))
    setReason(refund.reason)
    setSubmitted(false)
  }

  const submit = async () => {
    setSubmitted(true)
    if (!target || amountError || reasonError) return
    setSaving(true)
    try {
      await updateRefund(target.refund.id, target.action, amountNumber, reason.trim())
      toast.success(target.action === 'APPROVE' ? 'Refund approved' : 'Refund processed')
      setTarget(null)
      reload()
    } catch (caught) {
      toast.error(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Refunds & disputes" />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No refund requests" />}
      {items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Appointment</th><th>Amount</th><th>Reason</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {paginate(items, page, PAGE_SIZE).map((refund) => (
                <tr key={refund.id} className="border-t border-line">
                  <td className="p-3 font-medium">{refund.appointmentRef}</td><td>{formatINR(refund.amount)}</td><td>{refund.reason}</td><td><StatusBadge status={refund.status} /></td>
                  <td className="space-x-2 p-3">
                    {refund.status === 'REQUESTED' && <button type="button" className="btn-outline" onClick={() => open(refund, 'APPROVE')}>Approve</button>}
                    {refund.status === 'APPROVED' && <button type="button" className="btn-primary" onClick={() => open(refund, 'PROCESS')}>Process refund</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <Modal open={target !== null} title={target?.action === 'APPROVE' ? 'Approve refund' : 'Process refund'} onClose={() => setTarget(null)} footer={<><button type="button" className="btn-ghost" onClick={() => setTarget(null)}>Cancel</button><button type="button" className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />} Confirm</button></>}>
        <div className="space-y-3">
          <Field label="Amount (INR)" error={submitted ? amountError : ''}>{(props) => <input {...props} type="number" min={1} className="input" value={amount} onChange={(event) => setAmount(event.target.value)} />}</Field>
          <Field label="Reason" error={submitted ? reasonError : ''}>{(props) => <textarea {...props} className="input" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}</Field>
        </div>
      </Modal>
    </div>
  )
}

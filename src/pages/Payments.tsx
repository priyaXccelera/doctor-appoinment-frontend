import { useState } from 'react'
import { Download } from 'lucide-react'
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader, Pagination, StatusBadge, paginate } from '../components/ui'
import { getPayments } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Payment } from '../types'
import { downloadTextFile, formatDate, formatINR } from '../utils/format'

const PAGE_SIZE = 6

function downloadReceipt(payment: Payment) {
  downloadTextFile(
    `receipt-${payment.referenceNo}.txt`,
    [`RECEIPT`, `Reference: ${payment.referenceNo}`, `Doctor: ${payment.doctorName}`, `Date: ${formatDate(payment.date)}`, `Amount: ${formatINR(payment.amount)}`, `Method: ${payment.method}`, `Status: ${payment.status}`].join('\n'),
  )
}

export function Payments() {
  useDocumentMeta('Payments')
  const { data, loading, error, reload } = useAsync(getPayments)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const items = (data ?? []).filter((payment) => (!from || payment.date >= from) && (!to || payment.date <= to))

  return (
    <div>
      <PageHeader title="Payments" subtitle="Your payment history." />
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <Field label="From">{(props) => <input {...props} type="date" className="input" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1) }} />}</Field>
        <Field label="To">{(props) => <input {...props} type="date" className="input" value={to} onChange={(event) => { setTo(event.target.value); setPage(1) }} />}</Field>
      </div>
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No payments found" />}
      {items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr><th className="p-3">Date</th><th>Appointment</th><th>Method</th><th>Amount</th><th>Status</th><th><span className="sr-only">Receipt</span></th></tr>
            </thead>
            <tbody>
              {paginate(items, page, PAGE_SIZE).map((payment) => (
                <tr key={payment.id} className="border-t border-line">
                  <td className="p-3">{formatDate(payment.date)}</td>
                  <td>{payment.referenceNo} · {payment.doctorName}</td>
                  <td>{payment.method}</td>
                  <td className="font-semibold">{formatINR(payment.amount)}</td>
                  <td><StatusBadge status={payment.status} /></td>
                  <td><button type="button" className="btn-ghost" onClick={() => downloadReceipt(payment)} aria-label={`Download receipt ${payment.referenceNo}`}><Download size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

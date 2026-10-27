import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, paginate } from '../components/ui'
import { getPrescriptions } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import { formatDate } from '../utils/format'
import { downloadPrescription } from '../utils/prescriptionText'

const PAGE_SIZE = 5

export function Prescriptions() {
  useDocumentMeta('Prescriptions')
  const { data, loading, error, reload } = useAsync(getPrescriptions)
  const [page, setPage] = useState(1)
  const items = data ?? []

  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="All prescriptions issued by your doctors." />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No prescriptions yet" hint="Prescriptions appear here after a consultation." />}
      <div className="space-y-3">
        {paginate(items, page, PAGE_SIZE).map((rx) => (
          <article key={rx.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link to={`/prescriptions/${rx.id}`} className="font-bold hover:text-primary-text">{rx.doctorName}</Link>
              <p className="text-sm text-muted">Diagnosis: {rx.diagnosis}</p>
              <p className="text-xs text-muted">Appointment {formatDate(rx.appointmentDate)} · Issued {formatDate(rx.issuedAt.slice(0, 10))}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/prescriptions/${rx.id}`} className="btn-outline">View</Link>
              <button type="button" className="btn-ghost" onClick={() => downloadPrescription(rx)} aria-label={`Download prescription from ${rx.doctorName}`}>
                <Download size={16} />
              </button>
              <Link to={`/prescriptions/${rx.id}?print=1`} className="btn-ghost" aria-label="Print prescription">
                <Printer size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

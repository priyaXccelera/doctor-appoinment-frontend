import { useState } from 'react'
import { Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader, Pagination, Stat, StatusBadge, paginate } from '../components/ui'
import { getEarnings } from '../data/doctorStore'
import { useAsync, useDocumentMeta } from '../hooks'
import { addDaysISO, downloadTextFile, formatDate, formatINR, toCSV, todayISO } from '../utils/format'

const PAGE_SIZE = 6

export function DoctorEarnings() {
  useDocumentMeta('Earnings')
  const [from, setFrom] = useState(addDaysISO(todayISO(), -30))
  const [to, setTo] = useState(todayISO())
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => getEarnings(from, to), [from, to])
  const rows = data ?? []
  const gross = rows.reduce((sum, row) => sum + (row.status === 'PAID' ? row.fee : 0), 0)
  const commission = rows.reduce((sum, row) => sum + (row.status === 'PAID' ? row.commission : 0), 0)
  const chart = Object.values(
    rows.reduce<Record<string, { date: string; net: number }>>((accumulator, row) => {
      accumulator[row.date] = { date: row.date.slice(5), net: (accumulator[row.date]?.net ?? 0) + row.net }
      return accumulator
    }, {}),
  ).sort((first, second) => first.date.localeCompare(second.date))

  const exportCsv = () =>
    downloadTextFile(
      `earnings-${from}-${to}.csv`,
      toCSV([['Date', 'Reference', 'Patient', 'Fee', 'Commission', 'Net', 'Status'], ...rows.map((row) => [row.date, row.referenceNo, row.patient, row.fee, row.commission, row.net, row.status])]),
      'text/csv',
    )

  return (
    <div>
      <PageHeader title="Earnings" actions={<button type="button" className="btn-outline" disabled={rows.length === 0} onClick={exportCsv}><Download size={16} /> Export CSV</button>} />
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-4">
        <Field label="From">{(props) => <input {...props} type="date" className="input" value={from} max={to} onChange={(event) => { setFrom(event.target.value); setPage(1) }} />}</Field>
        <Field label="To">{(props) => <input {...props} type="date" className="input" value={to} min={from} onChange={(event) => { setTo(event.target.value); setPage(1) }} />}</Field>
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Gross" value={formatINR(gross)} />
        <Stat label="Commission" value={formatINR(commission)} />
        <Stat label="Net earnings" value={formatINR(gross - commission)} />
      </div>
      {loading && <ListSkeleton rows={2} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && rows.length === 0 && <EmptyState title="No earnings in this range" />}
      {chart.length > 0 && (
        <section className="card mb-4 h-64 p-4" aria-label="Earnings over time">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="net" fill="#0f766e" radius={[4, 4, 0, 0]} name="Net (INR)" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
      {rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Date</th><th>Ref</th><th>Patient</th><th>Fee</th><th>Commission</th><th>Net</th><th>Payment</th></tr></thead>
            <tbody>
              {paginate(rows, page, PAGE_SIZE).map((row) => (
                <tr key={row.paymentId} className="border-t border-line">
                  <td className="p-3">{formatDate(row.date)}</td><td>{row.referenceNo}</td><td>{row.patient}</td><td>{formatINR(row.fee)}</td><td>{formatINR(row.commission)}</td><td className="font-semibold">{formatINR(row.net)}</td><td><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

import { useState } from 'react'
import { Download } from 'lucide-react'
import { EmptyState, Field, PageHeader, Pagination, Spinner, paginate } from '../components/ui'
import { getReport } from '../data/adminStore'
import type { ReportResult, ReportType } from '../data/adminStore'
import { useDocumentMeta } from '../hooks'
import { errorMessage } from '../utils/errors'
import { addDaysISO, downloadTextFile, toCSV, todayISO } from '../utils/format'

const PAGE_SIZE = 8

export function AdminReports() {
  useDocumentMeta('Reports')
  const [type, setType] = useState<ReportType>('bookings')
  const [from, setFrom] = useState(addDaysISO(todayISO(), -30))
  const [to, setTo] = useState(addDaysISO(todayISO(), 30))
  const [result, setResult] = useState<ReportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const rangeError = from > to ? 'Start date must be before end date' : ''

  const generate = async () => {
    if (rangeError) return
    setLoading(true)
    setError('')
    try {
      setResult(await getReport(type, from, to))
      setPage(1)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    if (result) downloadTextFile(`${type}-report-${from}-${to}.csv`, toCSV([result.columns, ...result.rows]), 'text/csv')
  }

  return (
    <div>
      <PageHeader title="Reports" actions={<button type="button" className="btn-outline" disabled={!result || result.rows.length === 0} onClick={exportCsv}><Download size={16} /> Export CSV</button>} />
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-4">
        <Field label="Report type">
          {(props) => (
            <select {...props} className="input" value={type} onChange={(event) => setType(event.target.value as ReportType)}>
              <option value="bookings">Bookings</option>
              <option value="revenue">Revenue</option>
              <option value="commissions">Commissions</option>
              <option value="cancellations">Cancellations</option>
              <option value="no-shows">No-shows</option>
            </select>
          )}
        </Field>
        <Field label="From">{(props) => <input {...props} type="date" className="input" value={from} onChange={(event) => setFrom(event.target.value)} />}</Field>
        <Field label="To" error={rangeError}>{(props) => <input {...props} type="date" className="input" value={to} onChange={(event) => setTo(event.target.value)} />}</Field>
        <div className="pt-6"><button type="button" className="btn-primary w-full" disabled={loading || Boolean(rangeError)} onClick={generate}>{loading && <Spinner />} Generate</button></div>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
      {!result && !loading && <EmptyState title="No report generated" hint="Choose a type and date range, then click Generate." />}
      {result && result.rows.length === 0 && <EmptyState title="No data for this range" />}
      {result && result.rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr>{result.columns.map((column) => <th key={column} className="p-3">{column}</th>)}</tr></thead>
            <tbody>
              {paginate(result.rows, page, PAGE_SIZE).map((row, index) => (
                <tr key={index} className="border-t border-line">{row.map((cell, position) => <td key={position} className="p-3">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && <Pagination page={page} total={result.rows.length} pageSize={PAGE_SIZE} onChange={setPage} />}
    </div>
  )
}

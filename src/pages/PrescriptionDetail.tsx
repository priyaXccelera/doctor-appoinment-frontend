import { useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '../components/ui'
import { getPrescription } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import { formatDate } from '../utils/format'
import { downloadPrescription } from '../utils/prescriptionText'

export function PrescriptionDetail() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  useDocumentMeta('Prescription')
  const { data: rx, loading, error, reload } = useAsync(() => getPrescription(id), [id])

  useEffect(() => {
    if (rx && searchParams.get('print') === '1') window.print()
  }, [rx, searchParams])

  if (loading) return <Skeleton className="h-64 w-full" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!rx) return <EmptyState title="Prescription not found" action={<Link to="/prescriptions" className="btn-primary">Back to prescriptions</Link>} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2 print:hidden">
        <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => downloadPrescription(rx)}>
            <Download size={16} /> Download
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
      <article className="card space-y-5 p-6">
        <header className="border-b border-line pb-3">
          <h1 className="text-xl font-bold">{rx.doctorName}</h1>
          <p className="text-sm text-muted">Patient: {rx.patientName} · Issued {formatDate(rx.issuedAt.slice(0, 10))} · Appointment {formatDate(rx.appointmentDate)}</p>
        </header>
        <section>
          <h2 className="font-semibold">Diagnosis</h2>
          <p className="text-sm">{rx.diagnosis}</p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Medicines</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr><th className="py-1 pr-3">Name</th><th className="pr-3">Dosage</th><th className="pr-3">Frequency</th><th className="pr-3">Duration</th><th>Instructions</th></tr>
              </thead>
              <tbody>
                {rx.medicines.map((medicine, index) => (
                  <tr key={`${medicine.name}-${index}`} className="border-t border-line">
                    <td className="py-2 pr-3 font-medium">{medicine.name}</td>
                    <td className="pr-3">{medicine.dosage}</td>
                    <td className="pr-3">{medicine.frequency}</td>
                    <td className="pr-3">{medicine.duration}</td>
                    <td>{medicine.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="font-semibold">Tests</h2>
          <p className="text-sm">{rx.tests.length ? rx.tests.join(', ') : 'None advised'}</p>
        </section>
        <section>
          <h2 className="font-semibold">Advice</h2>
          <p className="text-sm">{rx.advice || 'None'}</p>
        </section>
        <section>
          <h2 className="font-semibold">Follow-up</h2>
          <p className="text-sm">{rx.followUpDate ? formatDate(rx.followUpDate) : 'Not required'}</p>
        </section>
      </article>
    </div>
  )
}

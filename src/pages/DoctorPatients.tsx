import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Avatar, EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, paginate } from '../components/ui'
import { getDoctorPatients } from '../data/doctorStore'
import { useAsync, useDocumentMeta } from '../hooks'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 6

export function DoctorPatients() {
  useDocumentMeta('Patients')
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(getDoctorPatients)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const items = (data ?? []).filter((patient) => patient.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div>
      <PageHeader title="Patients" />
      <div className="relative mb-4 max-w-sm">
        <label htmlFor="patient-search" className="sr-only">Search patients</label>
        <Search size={16} className="absolute left-3 top-3 text-muted" aria-hidden="true" />
        <input id="patient-search" className="input pl-9" placeholder="Search patients" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      </div>
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No patients found" />}
      <div className="space-y-2">
        {paginate(items, page, PAGE_SIZE).map((patient) => (
          <button key={patient.patientUserId} type="button" onClick={() => navigate(`/doctor/patients/${patient.patientUserId}`)} className="card flex w-full items-center gap-3 p-3 text-left hover:border-primary">
            <Avatar name={patient.name} size={44} />
            <span className="flex-1">
              <span className="block font-semibold">{patient.name}</span>
              <span className="block text-xs text-muted">{patient.age} yrs · {patient.gender}</span>
            </span>
            <span className="text-right text-sm">
              <span className="block">Last visit: {patient.lastVisit ? formatDate(patient.lastVisit) : 'Never'}</span>
              <span className="block text-xs text-muted">{patient.totalVisits} visits</span>
            </span>
          </button>
        ))}
      </div>
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  )
}

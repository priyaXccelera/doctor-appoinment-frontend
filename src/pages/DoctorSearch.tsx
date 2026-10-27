import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Filter, List, Map as MapIcon } from 'lucide-react'
import { DoctorCard } from '../components/DoctorCard'
import { Chip, EmptyState, ErrorState, ListSkeleton, Pagination } from '../components/ui'
import { searchDoctors } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import type { SearchParams } from '../types'

const PAGE_SIZE = 5

const FEE_RANGES = [
  { label: 'Any fee', min: '', max: '' },
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 - ₹800', min: '500', max: '800' },
  { label: 'Above ₹800', min: '800', max: '' },
]

function FacetOption({ label, count, checked, onChange, type = 'radio', name }: { label: string; count?: number; checked: boolean; onChange: () => void; type?: 'radio' | 'checkbox'; name: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 py-1 text-sm">
      <span className="flex items-center gap-2">
        <input type={type} name={name} checked={checked} onChange={onChange} className="accent-primary" />
        {label}
      </span>
      {count !== undefined && <span className="text-xs text-muted">{count}</span>}
    </label>
  )
}

export function DoctorSearch() {
  const [params, setParams] = useSearchParams()
  const routeParams = useParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')

  const specialtyFromRoute = routeParams.specialty ? decodeURIComponent(routeParams.specialty) : ''
  const get = (key: string) => params.get(key) ?? ''
  const specialty = specialtyFromRoute || get('specialty')
  const searchParams: SearchParams = {
    q: get('q') || undefined,
    city: get('city') || undefined,
    specialty: specialty || undefined,
    mode: get('mode') || undefined,
    feeMin: get('feeMin') ? Number(get('feeMin')) : undefined,
    feeMax: get('feeMax') ? Number(get('feeMax')) : undefined,
    experienceMin: get('experienceMin') ? Number(get('experienceMin')) : undefined,
    gender: get('gender') || undefined,
    language: get('language') || undefined,
    availability: get('availability') || undefined,
    ratingMin: get('ratingMin') ? Number(get('ratingMin')) : undefined,
    radiusKm: get('radiusKm') ? Number(get('radiusKm')) : undefined,
    sort: get('sort') || 'relevance',
    page: Number(get('page')) || 1,
    pageSize: PAGE_SIZE,
  }

  useDocumentMeta(
    specialty ? `Best ${specialty}s${searchParams.city ? ` in ${searchParams.city}` : ''}` : 'Find doctors near you',
    `Book appointments with verified ${specialty || 'doctors'}. Compare ratings, fees and availability.`,
    {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: specialty ? `${specialty} doctors` : 'Doctor search',
    },
  )

  const { data, loading, error, reload } = useAsync(() => searchDoctors(searchParams), [params.toString(), specialtyFromRoute])

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const activeChips: { key: string; label: string }[] = [
    ...(get('q') ? [{ key: 'q', label: `"${get('q')}"` }] : []),
    ...(get('city') ? [{ key: 'city', label: get('city') }] : []),
    ...(specialty && !specialtyFromRoute ? [{ key: 'specialty', label: specialty }] : []),
    ...(get('mode') ? [{ key: 'mode', label: get('mode') === 'VIDEO' ? 'Video' : 'Clinic' }] : []),
    ...(get('feeMin') || get('feeMax') ? [{ key: 'fee', label: `Fee ₹${get('feeMin') || 0} - ${get('feeMax') ? '₹' + get('feeMax') : 'any'}` }] : []),
    ...(get('experienceMin') ? [{ key: 'experienceMin', label: `${get('experienceMin')}+ yrs` }] : []),
    ...(get('gender') ? [{ key: 'gender', label: get('gender') }] : []),
    ...(get('language') ? [{ key: 'language', label: get('language') }] : []),
    ...(get('availability') ? [{ key: 'availability', label: `Available ${get('availability')}` }] : []),
    ...(get('ratingMin') ? [{ key: 'ratingMin', label: `${get('ratingMin')}+ stars` }] : []),
    ...(get('radiusKm') ? [{ key: 'radiusKm', label: `Within ${get('radiusKm')} km` }] : []),
  ]

  const removeChip = (key: string) => (key === 'fee' ? update({ feeMin: '', feeMax: '' }) : update({ [key]: '' }))
  const facets = data?.facets

  const filtersPanel = (
    <aside aria-label="Filters" className="card space-y-5 p-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold">Specialty</h3>
        {specialtyFromRoute ? (
          <p className="text-sm text-muted">{specialtyFromRoute} (<Link className="text-primary-text underline" to="/doctors">clear</Link>)</p>
        ) : (
          Object.entries(facets?.specialty ?? {}).map(([name, count]) => (
            <FacetOption key={name} name="specialty" type="checkbox" label={name} count={count} checked={specialty === name} onChange={() => update({ specialty: specialty === name ? '' : name })} />
          ))
        )}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Consultation mode</h3>
        {Object.entries(facets?.mode ?? {}).map(([name, count]) => (
          <FacetOption key={name} name="mode" label={name === 'VIDEO' ? 'Video consult' : 'Clinic visit'} count={count} checked={get('mode') === name} onChange={() => update({ mode: get('mode') === name ? '' : name })} />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Consultation fee</h3>
        {FEE_RANGES.map((range) => (
          <FacetOption key={range.label} name="fee" label={range.label} checked={get('feeMin') === range.min && get('feeMax') === range.max} onChange={() => update({ feeMin: range.min, feeMax: range.max })} />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Experience</h3>
        {[['', 'Any'], ['5', '5+ years'], ['10', '10+ years'], ['15', '15+ years']].map(([value, label]) => (
          <FacetOption key={label} name="exp" label={label} checked={get('experienceMin') === value} onChange={() => update({ experienceMin: value })} />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Gender</h3>
        {Object.entries(facets?.gender ?? {}).map(([name, count]) => (
          <FacetOption key={name} name="gender" label={name} count={count} checked={get('gender') === name} onChange={() => update({ gender: get('gender') === name ? '' : name })} />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Language</h3>
        {Object.entries(facets?.language ?? {}).map(([name, count]) => (
          <FacetOption key={name} name="language" label={name} count={count} checked={get('language') === name} onChange={() => update({ language: get('language') === name ? '' : name })} />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Availability</h3>
        {[['', 'Any time'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['next7', 'Next 7 days']].map(([value, label]) => (
          <FacetOption key={label} name="availability" label={label} checked={get('availability') === value} onChange={() => update({ availability: value })} />
        ))}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold">Rating</h3>
        {[['', 'Any'], ['4', '4.0 & above'], ['4.5', '4.5 & above']].map(([value, label]) => (
          <FacetOption key={label} name="rating" label={label} checked={get('ratingMin') === value} onChange={() => update({ ratingMin: value })} />
        ))}
      </div>
      <div>
        <label htmlFor="distance" className="mb-1 block text-sm font-semibold">
          Distance (from city centre)
        </label>
        <select id="distance" className="input" value={get('radiusKm')} onChange={(event) => update({ radiusKm: event.target.value })} disabled={!get('city')}>
          <option value="">Any distance</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
        </select>
        {!get('city') && <p className="mt-1 text-xs text-muted">Select a city on the home page to enable.</p>}
      </div>
    </aside>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{specialty ? `${specialty}s` : 'Doctors'}{get('city') ? ` in ${get('city')}` : ''}</h1>
          <p className="text-sm text-muted" aria-live="polite">
            {loading ? 'Searching...' : `${data?.total ?? 0} doctors found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost lg:hidden" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}>
            <Filter size={16} /> Filters
          </button>
          <label htmlFor="sort" className="sr-only">
            Sort by
          </label>
          <select id="sort" className="input w-auto" value={get('sort') || 'relevance'} onChange={(event) => update({ sort: event.target.value })}>
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="experience">Experience</option>
            <option value="fee">Fee: low to high</option>
            <option value="earliest">Earliest available</option>
          </select>
          <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="View mode">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={`px-3 py-2 ${view === 'list' ? 'bg-primary text-white' : ''}`} aria-label="List view">
              <List size={16} />
            </button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} className={`px-3 py-2 ${view === 'map' ? 'bg-primary text-white' : ''}`} aria-label="Map view">
              <MapIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} onRemove={() => removeChip(chip.key)}>
              {chip.label}
            </Chip>
          ))}
          <button type="button" className="text-sm font-semibold text-primary-text" onClick={() => setParams(new URLSearchParams())}>
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>{filtersPanel}</div>
        <section aria-label="Search results">
          {loading && <ListSkeleton rows={3} />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && data && data.items.length === 0 && (
            <EmptyState
              title="No doctors match your filters"
              hint="Try removing a filter or searching for a different specialty or city."
              action={
                <button type="button" className="btn-primary" onClick={() => setParams(new URLSearchParams())}>
                  Clear all filters
                </button>
              }
            />
          )}
          {!loading && !error && data && data.items.length > 0 && view === 'list' && (
            <div className="space-y-4">
              {data.items.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
          {!loading && !error && data && data.items.length > 0 && view === 'map' && (
            <div className="space-y-3">
              <iframe
                title="Map of clinics"
                className="h-80 w-full rounded-xl border border-line"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.items[0].clinics[0].lng - 0.08}%2C${data.items[0].clinics[0].lat - 0.06}%2C${data.items[0].clinics[0].lng + 0.08}%2C${data.items[0].clinics[0].lat + 0.06}&layer=mapnik&marker=${data.items[0].clinics[0].lat}%2C${data.items[0].clinics[0].lng}`}
              />
              <ul className="card divide-y divide-line">
                {data.items.map((doctor) => (
                  <li key={doctor.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                    <span>
                      <strong>{doctor.name}</strong> · {doctor.clinics[0]?.name}, {doctor.clinics[0]?.locality}
                    </span>
                    <Link to={`/doctors/${doctor.id}`} className="font-semibold text-primary-text">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Pagination page={searchParams.page ?? 1} total={data?.total ?? 0} pageSize={PAGE_SIZE} onChange={(page) => update({ page: String(page) })} />
        </section>
      </div>
    </div>
  )
}

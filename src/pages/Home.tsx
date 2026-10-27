import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Baby,
  Bone,
  ChevronDown,
  Eye,
  HeartPulse,
  LocateFixed,
  Brain,
  Search,
  SmilePlus,
  Stethoscope,
  Video,
  Activity,
  Ear,
  ShieldCheck,
  CalendarCheck,
  Flower2,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar, Skeleton, Stars } from '../components/ui'
import { getCities, getSuggestions, getSymptoms, getTopDoctors } from '../data/store'
import { useAsync, useDebounced, useDocumentMeta } from '../hooks'
import { formatINR } from '../utils/format'

const SPECIALTY_TILES: { name: string; icon: LucideIcon }[] = [
  { name: 'General Physician', icon: Stethoscope },
  { name: 'Gynecologist', icon: Flower2 },
  { name: 'Dermatologist', icon: Sparkles },
  { name: 'Pediatrician', icon: Baby },
  { name: 'Dentist', icon: SmilePlus },
  { name: 'Orthopedic', icon: Bone },
  { name: 'Cardiologist', icon: HeartPulse },
  { name: 'ENT Specialist', icon: Ear },
  { name: 'Psychiatrist', icon: Brain },
  { name: 'Ophthalmologist', icon: Eye },
]

// MOCK: placeholder testimonial copy until a testimonials endpoint exists
const TESTIMONIALS = [
  { name: 'Aarav S.', city: 'Bengaluru', text: 'Booked a cardiologist in under two minutes. The reminders were a lifesaver.' },
  { name: 'Diya P.', city: 'Mumbai', text: 'Video consult with a pediatrician at midnight. Calm, clear and affordable.' },
  { name: 'Rohan G.', city: 'Delhi', text: 'Loved seeing real reviews and next available slots before choosing.' },
]

// MOCK: placeholder FAQ copy
const FAQS = [
  { q: 'How do I book an appointment?', a: 'Search for a doctor, pick a slot on their profile and confirm in a few steps. You need to log in only when you book.' },
  { q: 'Can I cancel or reschedule?', a: 'Yes. Open My appointments to reschedule or cancel. You see the refund amount before you confirm.' },
  { q: 'How does video consultation work?', a: 'A join button appears in My appointments shortly before your slot and opens a secure video room.' },
  { q: 'What if I miss the payment window?', a: 'Slots are held for a few minutes. If the hold expires you are returned to slot selection to choose again.' },
]

export function Home() {
  const navigate = useNavigate()
  useDocumentMeta('Book doctor appointments online', 'Find verified doctors, book clinic visits or video consultations, and manage your care in one place.')
  const cities = useAsync(getCities)
  const symptoms = useAsync(getSymptoms)
  const topDoctors = useAsync(getTopDoctors)
  const [city, setCity] = useState('')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ type: string; label: string; value: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [locationMessage, setLocationMessage] = useState('')
  const debouncedQuery = useDebounced(query)

  useEffect(() => {
    let active = true
    getSuggestions(debouncedQuery)
      .then((result) => active && setSuggestions(result))
      .catch(() => active && setSuggestions([]))
    return () => {
      active = false
    }
  }, [debouncedQuery])

  const goSearch = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (query.trim()) params.set('q', query.trim())
    Object.entries(overrides).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)))
    navigate(`/doctors?${params.toString()}`)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    goSearch()
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported in this browser.')
      return
    }
    setLocationMessage('Detecting your location...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let best = ''
        let bestDistance = Infinity
        ;(cities.data ?? []).forEach((item) => {
          const [lat, lng] = (item.extra ?? '').split(',').map(Number)
          const distance = (lat - position.coords.latitude) ** 2 + (lng - position.coords.longitude) ** 2
          if (distance < bestDistance) {
            bestDistance = distance
            best = item.name
          }
        })
        setCity(best)
        setLocationMessage(best ? `Detected: ${best}` : 'Could not match your location to a city.')
      },
      () => setLocationMessage('Location permission denied. Please choose your city.'),
    )
  }

  const pickSuggestion = (item: { type: string; value: string }) => {
    setShowSuggestions(false)
    setQuery(item.value)
    if (item.type === 'specialty') goSearch({ specialty: item.value, q: '' })
    else goSearch({ q: item.value })
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-soft to-canvas px-4 pb-14 pt-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-extrabold sm:text-5xl">Your health, in calm and capable hands</h1>
          <p className="mt-3 text-muted">Find trusted doctors and book clinic visits or video consultations in minutes.</p>
          <form onSubmit={handleSubmit} role="search" className="card mt-8 flex flex-col gap-2 p-3 text-left md:flex-row">
            <div className="flex items-center gap-1 md:w-64">
              <label htmlFor="home-city" className="sr-only">
                City
              </label>
              <div className="relative flex-1">
                <select id="home-city" value={city} onChange={(event) => setCity(event.target.value)} className="input appearance-none pr-8">
                  <option value="">All cities</option>
                  {(cities.data ?? []).map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2 top-3 text-muted" aria-hidden="true" />
              </div>
              <button type="button" onClick={detectLocation} className="btn-ghost px-2" aria-label="Detect my location" title="Detect my location">
                <LocateFixed size={18} />
              </button>
            </div>
            <div className="relative flex-1">
              <label htmlFor="home-search" className="sr-only">
                Search doctors, specialties, symptoms or clinics
              </label>
              <Search size={16} className="absolute left-3 top-3 text-muted" aria-hidden="true" />
              <input
                id="home-search"
                className="input pl-9"
                placeholder="Search doctors, specialties, symptoms, clinics"
                value={query}
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="home-suggestions"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul id="home-suggestions" role="listbox" className="card absolute z-20 mt-1 max-h-64 w-full overflow-y-auto p-1">
                  {suggestions.map((item) => (
                    <li key={`${item.type}-${item.label}`} role="option" aria-selected="false">
                      <button type="button" onMouseDown={() => pickSuggestion(item)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-primary-soft">
                        {item.label}
                        <span className="text-xs capitalize text-muted">{item.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
          {locationMessage && (
            <p className="mt-2 text-sm text-muted" role="status">
              {locationMessage}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Book by specialty</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SPECIALTY_TILES.map((tile) => (
            <Link key={tile.name} to={`/specialties/${encodeURIComponent(tile.name)}`} className="card flex flex-col items-center gap-2 p-4 text-center text-sm font-medium hover:border-primary">
              <tile.icon className="text-primary-text" size={28} aria-hidden="true" />
              {tile.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="card flex flex-col items-center justify-between gap-4 bg-primary-soft p-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <Video className="text-primary-text" size={40} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold">Book a video consultation</h2>
              <p className="text-sm text-muted">Talk to a doctor from home. No travel, no waiting rooms.</p>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={() => navigate('/doctors?mode=VIDEO')}>
            Consult online
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-4 text-2xl font-bold">Common symptoms</h2>
        <div className="flex flex-wrap gap-2">
          {(symptoms.data ?? []).map((item) => (
            <Link key={item.id} to={`/doctors?q=${encodeURIComponent(item.name)}`} className="rounded-full border border-line bg-card px-4 py-1.5 text-sm hover:border-primary hover:bg-primary-soft">
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Top-rated doctors</h2>
          <Link to="/doctors?sort=rating" className="text-sm font-semibold text-primary-text">
            View all
          </Link>
        </div>
        <div className="flex snap-x gap-4 overflow-x-auto pb-3" aria-label="Top rated doctors">
          {topDoctors.loading &&
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 w-64 shrink-0" />)}
          {(topDoctors.data ?? []).map((doctor) => (
            <Link key={doctor.id} to={`/doctors/${doctor.id}`} className="card w-64 shrink-0 snap-start p-4 hover:border-primary">
              <Avatar src={doctor.photoUrl} name={doctor.name} size={64} />
              <h3 className="mt-3 font-bold">{doctor.name}</h3>
              <p className="text-sm text-primary-text">{doctor.specialties[0]}</p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Stars value={doctor.rating} size={12} /> {doctor.rating}
              </p>
              <p className="mt-1 text-sm text-muted">From {formatINR(doctor.consultationFees.video)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Search, title: '1. Search', text: 'Find doctors by specialty, symptom, clinic or city.' },
            { icon: CalendarCheck, title: '2. Book', text: 'Pick a slot, add patient details and pay securely.' },
            { icon: Activity, title: '3. Consult', text: 'Visit the clinic or join the video call and get your prescription.' },
          ].map((step) => (
            <div key={step.title} className="card p-5">
              <step.icon className="text-primary-text" aria-hidden="true" />
              <h3 className="mt-2 font-bold">{step.title}</h3>
              <p className="text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-6 text-2xl font-bold">Loved by patients</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="card p-5">
              <Stars value={5} />
              <blockquote className="mt-2 text-sm">&ldquo;{item.text}&rdquo;</blockquote>
              <figcaption className="mt-3 text-xs text-muted">
                {item.name}, {item.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="text-primary-text" aria-hidden="true" /> Frequently asked questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((item, index) => (
            <div key={item.q} className="card">
              <h3>
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold"
                >
                  {item.q}
                  <ChevronDown size={18} className={openFaq === index ? 'rotate-180' : ''} aria-hidden="true" />
                </button>
              </h3>
              {openFaq === index && <p className="px-4 pb-4 text-sm text-muted">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

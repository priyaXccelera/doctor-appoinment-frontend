import { Link } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-bold text-primary-text">
            <HeartPulse size={18} aria-hidden="true" /> MediBook
          </p>
          <p className="mt-2 text-sm text-muted">Trusted doctors, simple booking, calm care.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">For patients</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link to="/doctors" className="hover:text-ink">Find doctors</Link></li>
            <li><Link to="/doctors?mode=VIDEO" className="hover:text-ink">Video consultation</Link></li>
            <li><Link to="/appointments" className="hover:text-ink">My appointments</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Specialties</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link to="/specialties/Dermatologist" className="hover:text-ink">Dermatologists</Link></li>
            <li><Link to="/specialties/Cardiologist" className="hover:text-ink">Cardiologists</Link></li>
            <li><Link to="/specialties/Pediatrician" className="hover:text-ink">Pediatricians</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">For doctors</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link to="/register" className="hover:text-ink">Join as a doctor</Link></li>
            <li><Link to="/login" className="hover:text-ink">Doctor login</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">
        All times are shown in the doctor&apos;s local time (IST). © MediBook
      </p>
    </footer>
  )
}

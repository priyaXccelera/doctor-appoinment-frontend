import { Link, useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { currentRole, homePathForRole } from '../auth/auth'

export function NotAuthorized() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <ShieldOff size={48} className="text-danger" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Not authorized</h1>
      <p className="max-w-sm text-sm text-muted">Your account does not have permission to view this page.</p>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
        <Link to={homePathForRole(currentRole())} className="btn-primary">
          Go to my home
        </Link>
      </div>
    </div>
  )
}

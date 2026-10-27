import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-soft to-canvas p-4">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-primary-text">
          <HeartPulse aria-hidden="true" /> MediBook
        </Link>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

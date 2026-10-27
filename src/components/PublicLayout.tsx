import { Link, NavLink, Outlet } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { Footer } from './Footer'
import { NotificationBell, ThemeToggle, UserMenu } from './TopBar'
import { currentRole } from '../auth/auth'

export function PublicLayout() {
  const role = currentRole()

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-text">
            <HeartPulse aria-hidden="true" /> MediBook
          </Link>
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-4 text-sm font-medium sm:flex">
            <NavLink to="/doctors" className={({ isActive }) => (isActive ? 'text-primary-text' : 'text-muted hover:text-ink')}>
              Find doctors
            </NavLink>
            {role === 'PATIENT' && (
              <NavLink to="/appointments" className={({ isActive }) => (isActive ? 'text-primary-text' : 'text-muted hover:text-ink')}>
                My appointments
              </NavLink>
            )}
          </nav>
          <div className="flex-1" />
          <ThemeToggle />
          {role && <NotificationBell />}
          <UserMenu />
        </div>
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

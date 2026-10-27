import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileHeart,
  FileText,
  Flag,
  HeartPulse,
  LayoutDashboard,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCircle,
  Users,
  Wallet,
  Database,
  RotateCcw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { currentRole } from '../auth/auth'
import type { Role } from '../types'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: Role[]
}

export const navItems: NavItem[] = [
  { label: 'Find doctors', to: '/doctors', icon: Search, roles: ['PATIENT'] },
  { label: 'My appointments', to: '/appointments', icon: CalendarCheck, roles: ['PATIENT'] },
  { label: 'Prescriptions', to: '/prescriptions', icon: FileText, roles: ['PATIENT'] },
  { label: 'Medical records', to: '/records', icon: FileHeart, roles: ['PATIENT'] },
  { label: 'Family members', to: '/family', icon: Users, roles: ['PATIENT'] },
  { label: 'Payments', to: '/payments', icon: CreditCard, roles: ['PATIENT'] },
  { label: 'Notifications', to: '/notifications', icon: Bell, roles: ['PATIENT'] },
  { label: 'Profile & settings', to: '/profile', icon: UserCircle, roles: ['PATIENT'] },

  { label: 'Dashboard', to: '/doctor/dashboard', icon: LayoutDashboard, roles: ['DOCTOR'] },
  { label: 'Appointments', to: '/doctor/appointments', icon: CalendarDays, roles: ['DOCTOR'] },
  { label: 'Availability', to: '/doctor/availability', icon: CalendarClock, roles: ['DOCTOR'] },
  { label: 'Patients', to: '/doctor/patients', icon: Users, roles: ['DOCTOR'] },
  { label: 'Reviews', to: '/doctor/reviews', icon: Star, roles: ['DOCTOR'] },
  { label: 'Earnings', to: '/doctor/earnings', icon: Wallet, roles: ['DOCTOR'] },
  { label: 'My profile', to: '/doctor/profile', icon: UserCircle, roles: ['DOCTOR'] },

  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { label: 'Doctor verification', to: '/admin/verification', icon: ShieldCheck, roles: ['ADMIN'] },
  { label: 'Master data', to: '/admin/master-data', icon: Database, roles: ['ADMIN'] },
  { label: 'Users', to: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Refunds & disputes', to: '/admin/refunds', icon: RotateCcw, roles: ['ADMIN'] },
  { label: 'Review moderation', to: '/admin/reviews', icon: Flag, roles: ['ADMIN'] },
  { label: 'Platform settings', to: '/admin/settings', icon: Percent, roles: ['ADMIN'] },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['ADMIN'] },
]

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const role = currentRole()
  const items = navItems.filter((item) => role && item.roles.includes(role))

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={onNavigate} aria-hidden="true" />}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-line bg-card transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-line px-5 text-lg font-bold text-primary-text">
          <HeartPulse aria-hidden="true" />
          MediBook
          <span className="ml-auto rounded bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase">{role}</span>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary text-white' : 'text-muted hover:bg-primary-soft hover:text-ink'
                }`
              }
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-primary-soft hover:text-ink">
            <ClipboardList size={18} aria-hidden="true" />
            Public site
          </NavLink>
          <NavLink
            to="/notification-preferences"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-primary text-white' : 'text-muted hover:bg-primary-soft hover:text-ink'
              }`
            }
          >
            <Settings size={18} aria-hidden="true" />
            Notification settings
          </NavLink>
        </nav>
      </aside>
    </>
  )
}

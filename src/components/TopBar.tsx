import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { currentUser, homePathForRole, logout } from '../auth/auth'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../data/store'
import { useTheme } from '../hooks'
import type { NotificationItem } from '../types'
import { relativeTime } from '../utils/format'
import { Avatar, ConfirmDialog } from './ui'

export function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button type="button" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} className="rounded-lg p-2 text-muted hover:bg-primary-soft">
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const load = () => {
    getNotifications()
      .then(setItems)
      .catch(() => setItems([]))
  }

  useEffect(load, [location.pathname])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = items.filter((item) => !item.read).length

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-muted hover:bg-primary-soft"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-soft px-1 text-[10px] font-bold text-danger">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-80 max-w-[90vw] p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              type="button"
              className="text-xs font-semibold text-primary-text"
              onClick={() => markAllNotificationsRead().then(load)}
            >
              Mark all as read
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 && <li className="px-2 py-4 text-center text-sm text-muted">No notifications</li>}
            {items.slice(0, 5).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => markNotificationRead(item.id).then(load)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-primary-soft ${item.read ? 'text-muted' : 'font-medium'}`}
                >
                  {item.message}
                  <span className="block text-xs text-muted">{relativeTime(item.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-1 w-full rounded-lg py-2 text-center text-sm font-semibold text-primary-text hover:bg-primary-soft"
            onClick={() => {
              setOpen(false)
              navigate('/notifications')
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}

export function UserMenu() {
  const user = currentUser()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="btn-ghost">
          Log in
        </Link>
        <Link to="/register" className="btn-primary">
          Sign up
        </Link>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    setConfirming(false)
    toast.success('Signed out')
    navigate('/login')
  }

  const homePath = user.role === 'PATIENT' ? '/appointments' : homePathForRole(user.role)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-primary-soft"
      >
        <Avatar name={user.name} size={32} />
        <span className="hidden text-sm font-medium sm:block">{user.name}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-52 p-1">
          <Link to={homePath} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-primary-soft">
            {user.role === 'PATIENT' ? 'My appointments' : 'Dashboard'}
          </Link>
          <Link
            to={user.role === 'DOCTOR' ? '/doctor/profile' : user.role === 'ADMIN' ? '/admin/settings' : '/profile'}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-primary-soft"
          >
            {user.role === 'ADMIN' ? 'Platform settings' : 'Profile'}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setConfirming(true)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title="Log out?"
        message="You will need to sign in again to access your account."
        confirmLabel="Log out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-card px-4">
      <button type="button" onClick={onMenu} aria-label="Open navigation menu" className="rounded-lg p-2 text-muted hover:bg-primary-soft md:hidden">
        <Menu size={20} />
      </button>
      <div className="flex-1" />
      <ThemeToggle />
      <NotificationBell />
      <UserMenu />
    </header>
  )
}

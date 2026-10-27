import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { currentRole, isAuthenticated } from '../auth/auth'
import type { Role } from '../types'

interface RequireAuthProps {
  roles?: Role[]
  children?: ReactNode
}

export function RequireAuth({ roles, children }: RequireAuthProps) {
  const location = useLocation()

  if (!isAuthenticated()) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  const role = currentRole()
  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/not-authorized" replace />
  }

  return <>{children ?? <Outlet />}</>
}

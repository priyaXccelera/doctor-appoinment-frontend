import { useState } from 'react'
import toast from 'react-hot-toast'
import { ConfirmDialog, EmptyState, ErrorState, Field, ListSkeleton, PageHeader, Pagination, StatusBadge, paginate } from '../components/ui'
import { getAdminUsers, setUserStatus } from '../data/adminStore'
import { useAsync, useDocumentMeta } from '../hooks'
import type { Role, User } from '../types'

const PAGE_SIZE = 6

export function AdminUsers() {
  useDocumentMeta('Users')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => getAdminUsers(role || undefined), [role])
  const [target, setTarget] = useState<User | null>(null)
  const items = data ?? []

  const confirm = async () => {
    if (!target) return
    await setUserStatus(target.id, target.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED')
    toast.success(target.status === 'BLOCKED' ? 'User unblocked' : 'User blocked')
    setTarget(null)
    reload()
  }

  return (
    <div>
      <PageHeader title="Users" />
      <div className="mb-4 max-w-xs">
        <Field label="Role">
          {(props) => (
            <select {...props} className="input" value={role} onChange={(event) => { setRole(event.target.value as Role | ''); setPage(1) }}>
              <option value="">All roles</option>
              <option value="PATIENT">Patients</option>
              <option value="DOCTOR">Doctors</option>
              <option value="ADMIN">Admins</option>
            </select>
          )}
        </Field>
      </div>
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="No users found" />}
      {items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted"><tr><th className="p-3">Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {paginate(items, page, PAGE_SIZE).map((user) => (
                <tr key={user.id} className="border-t border-line">
                  <td className="p-3 font-medium">{user.name}</td><td>{user.email}</td><td>{user.mobile}</td><td>{user.role}</td>
                  <td><StatusBadge status={user.status} /></td>
                  <td className="p-3">
                    <button type="button" className={user.status === 'BLOCKED' ? 'btn-outline' : 'btn-danger'} disabled={user.role === 'ADMIN'} onClick={() => setTarget(user)}>
                      {user.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <ConfirmDialog open={target !== null} title={target?.status === 'BLOCKED' ? 'Unblock user?' : 'Block user?'} message={`${target?.name ?? ''} ${target?.status === 'BLOCKED' ? 'will be able to sign in again.' : 'will no longer be able to sign in.'}`} confirmLabel={target?.status === 'BLOCKED' ? 'Unblock' : 'Block'} danger={target?.status !== 'BLOCKED'} onCancel={() => setTarget(null)} onConfirm={confirm} />
    </div>
  )
}

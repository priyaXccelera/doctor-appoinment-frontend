import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Settings, Trash2 } from 'lucide-react'
import { ConfirmDialog, EmptyState, ErrorState, ListSkeleton, PageHeader } from '../components/ui'
import { clearNotifications, getNotifications, markAllNotificationsRead, markNotificationRead } from '../data/store'
import { useAsync, useDocumentMeta } from '../hooks'
import { relativeTime } from '../utils/format'

export function Notifications() {
  useDocumentMeta('Notifications')
  const { data, loading, error, reload } = useAsync(getNotifications)
  const [confirmClear, setConfirmClear] = useState(false)
  const items = data ?? []
  const unread = items.filter((item) => !item.read).length

  return (
    <div>
      <PageHeader
        title={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        actions={
          <>
            <button type="button" className="btn-ghost" disabled={unread === 0} onClick={() => markAllNotificationsRead().then(reload)}><CheckCheck size={16} /> Mark all as read</button>
            <button type="button" className="btn-danger" disabled={items.length === 0} onClick={() => setConfirmClear(true)}><Trash2 size={16} /> Clear all</button>
            <Link to="/notification-preferences" className="btn-outline"><Settings size={16} /> Preferences</Link>
          </>
        }
      />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <EmptyState title="You're all caught up" hint="New notifications will show up here." />}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`card flex items-center gap-3 p-3 ${item.read ? '' : 'border-primary'}`}>
            <Bell size={18} className={item.read ? 'text-muted' : 'text-primary-text'} aria-hidden="true" />
            <div className="flex-1">
              <p className={`text-sm ${item.read ? 'text-muted' : 'font-semibold'}`}>{item.message}</p>
              <p className="text-xs text-muted">{relativeTime(item.createdAt)}</p>
            </div>
            {!item.read && (
              <button type="button" className="btn-ghost" onClick={() => markNotificationRead(item.id).then(reload)}>Mark as read</button>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog open={confirmClear} title="Clear all notifications?" message="This removes every notification from your list." confirmLabel="Clear all" danger onCancel={() => setConfirmClear(false)} onConfirm={() => clearNotifications().then(() => { setConfirmClear(false); reload() })} />
    </div>
  )
}

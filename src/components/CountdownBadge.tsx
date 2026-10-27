import { Timer } from 'lucide-react'
import { useCountdown } from '../hooks'
import { formatCountdown } from '../utils/format'

export function CountdownBadge({ expiresAt, label = 'Slot held for' }: { expiresAt: string | null | undefined; label?: string }) {
  const seconds = useCountdown(expiresAt)
  const urgent = seconds <= 60
  return (
    <p
      role="timer"
      aria-live="off"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${urgent ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'}`}
    >
      <Timer size={16} aria-hidden="true" />
      {label} {formatCountdown(seconds)}
    </p>
  )
}

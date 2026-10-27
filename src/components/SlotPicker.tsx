import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { getNextAvailable, getSlots } from '../data/store'
import { useAsync, useVisibilityRefresh } from '../hooks'
import type { Mode } from '../types'
import { addDaysISO, formatShortDay, formatTime, todayISO } from '../utils/format'
import { groupSlotsByPeriod } from '../utils/slots'
import { ErrorState, Skeleton } from './ui'

export interface SelectedSlot {
  date: string
  startTime: string
}

interface SlotPickerProps {
  doctorId: string
  mode: Mode
  clinicId?: string
  selected: SelectedSlot | null
  onSelect: (slot: SelectedSlot) => void
  refreshKey?: number
}

export function SlotPicker({ doctorId, mode, clinicId, selected, onSelect, refreshKey = 0 }: SlotPickerProps) {
  const [windowStart, setWindowStart] = useState(todayISO())
  const [activeDate, setActiveDate] = useState(selected?.date ?? todayISO())

  const { data, loading, error, reload } = useAsync(
    () => getSlots(doctorId, windowStart, addDaysISO(windowStart, 6), mode, clinicId),
    [doctorId, windowStart, mode, clinicId, refreshKey],
  )

  // Real-time feel: refresh slots when the user returns to the tab.
  useVisibilityRefresh(reload)

  useEffect(() => {
    if (data && !data.some((day) => day.date === activeDate)) setActiveDate(data[0]?.date ?? windowStart)
  }, [data, activeDate, windowStart])

  const jumpToNext = async () => {
    const next = await getNextAvailable(doctorId, mode)
    if (!next) return
    const diffDays = Math.floor((new Date(next.date).getTime() - new Date(windowStart).getTime()) / 86400000)
    if (diffDays < 0 || diffDays > 6) setWindowStart(next.date)
    setActiveDate(next.date)
    onSelect({ date: next.date, startTime: next.startTime })
  }

  const activeDay = data?.find((day) => day.date === activeDate)
  const groups = groupSlotsByPeriod(activeDay?.slots ?? [])

  return (
    <div>
      <div className="mb-3 flex items-center gap-1">
        <button
          type="button"
          className="btn-ghost px-2"
          disabled={windowStart <= todayISO()}
          onClick={() => setWindowStart(addDaysISO(windowStart, -7) < todayISO() ? todayISO() : addDaysISO(windowStart, -7))}
          aria-label="Previous 7 days"
        >
          <ChevronLeft size={16} />
        </button>
        <div role="tablist" aria-label="Choose a date" className="grid flex-1 grid-cols-7 gap-1">
          {(data ?? Array.from({ length: 7 }, (_, index) => ({ date: addDaysISO(windowStart, index), slots: [] }))).map((day) => {
            const parts = formatShortDay(day.date)
            const count = day.slots.filter((slot) => slot.available).length
            const active = day.date === activeDate
            return (
              <button
                key={day.date}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${parts.weekday} ${parts.day} ${parts.month}, ${count} slots available`}
                onClick={() => setActiveDate(day.date)}
                className={`rounded-lg border px-1 py-2 text-center text-xs ${
                  active ? 'border-primary bg-primary text-white' : 'border-line hover:bg-primary-soft'
                }`}
              >
                <span className="block font-semibold">{parts.weekday}</span>
                <span className="block text-base font-bold">{parts.day}</span>
                <span className={`block text-[10px] ${active ? 'text-white' : count ? 'text-success' : 'text-muted'}`}>
                  {count ? `${count} slots` : 'None'}
                </span>
              </button>
            )
          })}
        </div>
        <button type="button" className="btn-ghost px-2" onClick={() => setWindowStart(addDaysISO(windowStart, 7))} aria-label="Next 7 days">
          <ChevronRight size={16} />
        </button>
      </div>

      <button type="button" className="btn-outline mb-3 w-full" onClick={jumpToNext}>
        <Zap size={16} aria-hidden="true" /> Jump to next available slot
      </button>

      {loading && !data && <Skeleton className="h-32 w-full" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && groups.length === 0 && (
        <p className="rounded-lg bg-neutral-soft p-4 text-center text-sm text-neutral">No slots on this day. Try another date.</p>
      )}

      <div role="radiogroup" aria-label="Available time slots" className="space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{group.label}</p>
            <div className="grid grid-cols-3 gap-2">
              {group.slots.map((slot) => {
                const isSelected = selected?.date === activeDate && selected.startTime === slot.startTime
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!slot.available}
                    aria-label={`${formatTime(slot.startTime)}${slot.available ? '' : ', unavailable'}`}
                    onClick={() => onSelect({ date: activeDate, startTime: slot.startTime })}
                    className={`rounded-lg border px-2 py-1.5 text-sm font-medium ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : slot.available
                          ? 'border-line hover:border-primary hover:bg-primary-soft'
                          : 'cursor-not-allowed border-line bg-neutral-soft text-muted line-through opacity-60'
                    }`}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        Times shown in the doctor&apos;s local time (IST).
      </p>
    </div>
  )
}

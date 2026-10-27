import type { Availability, DaySchedule, Mode, Slot, TimeRange } from '../types'
import { addDaysISO, parseISODate } from './format'

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function overlapsAny(start: number, end: number, ranges: TimeRange[]): boolean {
  return ranges.some((range) => start < toMinutes(range.end) && end > toMinutes(range.start))
}

/** Pure generator: slots for one day schedule, skipping breaks. */
export function generateDaySlots(schedule: DaySchedule, ranges: TimeRange[] = schedule.ranges): Slot[] {
  const slots: Slot[] = []
  const step = Math.max(5, schedule.slotMinutes)
  for (const range of ranges) {
    let cursor = toMinutes(range.start)
    const limit = toMinutes(range.end)
    while (cursor + step <= limit) {
      const end = cursor + step
      if (!overlapsAny(cursor, end, schedule.breaks)) {
        slots.push({ startTime: fromMinutes(cursor), endTime: fromMinutes(end), available: true })
      }
      cursor = end + schedule.buffer
    }
  }
  return slots
}

function pseudoRandomTaken(seed: string): boolean {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973
  }
  // MOCK: deterministic stand-in for slots booked by other patients
  return hash % 6 === 0
}

export interface SlotContext {
  doctorId: string
  availability: Availability
  bookedKeys: Set<string>
  mode: Mode
  clinicId?: string
  now?: Date
  leadTimeHours?: number
  simulateTaken?: boolean
}

export function slotKey(doctorId: string, date: string, startTime: string): string {
  return `${doctorId}|${date}|${startTime}`
}

export function buildSlotsForDate(date: string, context: SlotContext): Slot[] {
  const { availability, doctorId, mode, clinicId, bookedKeys } = context
  const now = context.now ?? new Date()
  const onLeave = availability.leaves.some((leave) => date >= leave.fromDate && date <= leave.toDate)
  if (onLeave) return []
  const override = availability.overrides.find((item) => item.date === date)
  if (override?.closed) return []
  const weekday = parseISODate(date).getDay()
  const schedule = availability.weekly.find((item) => item.day === weekday)
  if (!schedule || (!schedule.enabled && !override)) return []
  if (schedule.mode !== 'BOTH' && schedule.mode !== mode) return []
  if (clinicId && mode === 'CLINIC' && schedule.clinicId && schedule.clinicId !== clinicId) return []
  const generated = generateDaySlots(schedule, override ? override.ranges : schedule.ranges)
  const earliest = now.getTime() + (context.leadTimeHours ?? 0) * 3600000
  return generated.map((slot) => {
    const [hours, minutes] = slot.startTime.split(':').map(Number)
    const start = parseISODate(date)
    start.setHours(hours, minutes, 0, 0)
    const inPast = start.getTime() < earliest
    const taken =
      bookedKeys.has(slotKey(doctorId, date, slot.startTime)) ||
      (context.simulateTaken !== false && pseudoRandomTaken(slotKey(doctorId, date, slot.startTime)))
    return { ...slot, available: !inPast && !taken }
  })
}

export function buildSlotRange(from: string, to: string, context: SlotContext) {
  const days = []
  let cursor = from
  let guard = 0
  while (cursor <= to && guard < 60) {
    days.push({ date: cursor, slots: buildSlotsForDate(cursor, context) })
    cursor = addDaysISO(cursor, 1)
    guard += 1
  }
  return days
}

export function groupSlotsByPeriod(slots: Slot[]): { label: string; slots: Slot[] }[] {
  const groups = [
    { label: 'Morning', slots: slots.filter((slot) => toMinutes(slot.startTime) < 720) },
    { label: 'Afternoon', slots: slots.filter((slot) => toMinutes(slot.startTime) >= 720 && toMinutes(slot.startTime) < 1020) },
    { label: 'Evening', slots: slots.filter((slot) => toMinutes(slot.startTime) >= 1020) },
  ]
  return groups.filter((group) => group.slots.length > 0)
}

export function findConflicts(
  leave: { fromDate: string; toDate: string },
  appointments: { date: string; status: string }[],
): number {
  const active = ['CONFIRMED', 'PENDING_PAYMENT', 'RESCHEDULED']
  return appointments.filter(
    (appointment) =>
      active.includes(appointment.status) && appointment.date >= leave.fromDate && appointment.date <= leave.toDate,
  ).length
}

import { defaultAvailability } from '../data/mockData'
import { addDaysISO, todayISO } from './format'
import { buildSlotsForDate, findConflicts, generateDaySlots, groupSlotsByPeriod, slotKey } from './slots'

const availability = defaultAvailability('d1')
const futureMonday = (() => {
  let date = addDaysISO(todayISO(), 3)
  while (new Date(`${date}T00:00:00`).getDay() !== 1) date = addDaysISO(date, 1)
  return date
})()

describe('slot picker logic', () => {
  test('skips breaks when generating slots', () => {
    const slots = generateDaySlots(availability.weekly[1])
    expect(slots.some((slot) => slot.startTime === '11:00')).toBe(false)
    expect(slots[0].startTime).toBe('09:00')
  })

  test('marks booked slots unavailable', () => {
    const base = { doctorId: 'd1', availability, mode: 'CLINIC' as const, simulateTaken: false }
    const open = buildSlotsForDate(futureMonday, { ...base, bookedKeys: new Set() })
    expect(open.find((slot) => slot.startTime === '09:00')?.available).toBe(true)
    const booked = buildSlotsForDate(futureMonday, { ...base, bookedKeys: new Set([slotKey('d1', futureMonday, '09:00')]) })
    expect(booked.find((slot) => slot.startTime === '09:00')?.available).toBe(false)
  })

  test('returns no slots on a leave day', () => {
    const withLeave = { ...availability, leaves: [{ id: 'l1', fromDate: futureMonday, toDate: futureMonday, reason: 'Trip' }] }
    expect(buildSlotsForDate(futureMonday, { doctorId: 'd1', availability: withLeave, mode: 'CLINIC', bookedKeys: new Set() })).toHaveLength(0)
  })

  test('groups slots into morning, afternoon and evening', () => {
    const groups = groupSlotsByPeriod(generateDaySlots({ ...availability.weekly[1], ranges: [{ start: '09:00', end: '20:00' }], breaks: [] }))
    expect(groups.map((group) => group.label)).toEqual(['Morning', 'Afternoon', 'Evening'])
  })

  test('detects leave conflicts with existing appointments', () => {
    const count = findConflicts({ fromDate: '2026-03-01', toDate: '2026-03-05' }, [
      { date: '2026-03-02', status: 'CONFIRMED' },
      { date: '2026-03-03', status: 'CANCELLED_BY_PATIENT' },
    ])
    expect(count).toBe(1)
  })
})

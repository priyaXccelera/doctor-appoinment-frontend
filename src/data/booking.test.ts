import { currentUser } from '../auth/auth'
import { addDaysISO, todayISO } from '../utils/format'
import { createAppointment, getSlots, holdSlot } from './store'

function loginAs(id: string) {
  localStorage.setItem('auth_token', JSON.stringify({ token: 't', id, name: 'Test', email: 't@x.com', role: 'PATIENT' }))
}

async function firstOpenSlot() {
  const days = await getSlots('d1', addDaysISO(todayISO(), 2), addDaysISO(todayISO(), 9), 'VIDEO')
  const day = days.find((item) => item.slots.some((slot) => slot.available))!
  return { date: day.date, startTime: day.slots.find((slot) => slot.available)!.startTime }
}

beforeEach(() => localStorage.clear())

test('second patient gets a 409 conflict for a held slot', async () => {
  const slot = await firstOpenSlot()
  loginAs('u-pat1')
  await holdSlot({ doctorId: 'd1', clinicId: 'c1', mode: 'VIDEO', ...slot })
  loginAs('u-pat2')
  await expect(holdSlot({ doctorId: 'd1', clinicId: 'c1', mode: 'VIDEO', ...slot })).rejects.toMatchObject({ code: 'SLOT_TAKEN', status: 409 })
  expect(currentUser()?.id).toBe('u-pat2')
})

test('booking with an expired hold is rejected', async () => {
  const slot = await firstOpenSlot()
  loginAs('u-pat1')
  const hold = await holdSlot({ doctorId: 'd1', clinicId: 'c1', mode: 'VIDEO', ...slot })
  const holds = JSON.parse(localStorage.getItem('holds') ?? '[]')
  holds[0].expiresAt = new Date(Date.now() - 1000).toISOString()
  localStorage.setItem('holds', JSON.stringify(holds))
  await expect(createAppointment({ holdId: hold.holdId, patientMemberId: 'self', reason: 'Checkup', payAtClinic: false })).rejects.toMatchObject({ code: 'HOLD_EXPIRED' })
})

test('a valid hold creates a pending-payment appointment', async () => {
  const slot = await firstOpenSlot()
  loginAs('u-pat1')
  const hold = await holdSlot({ doctorId: 'd1', clinicId: 'c1', mode: 'VIDEO', ...slot })
  const appointment = await createAppointment({ holdId: hold.holdId, patientMemberId: 'self', reason: 'Checkup', payAtClinic: false })
  expect(appointment.status).toBe('PENDING_PAYMENT')
})

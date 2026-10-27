import { mockSettings } from '../data/mockData'
import type { Appointment } from '../types'
import { computeRefund } from './refund'

const base = { date: '2026-06-10', startTime: '10:00', fee: 500, paymentStatus: 'PAID' } as Appointment

test('full refund outside the cancellation window', () => {
  expect(computeRefund(base, mockSettings, new Date('2026-06-05T10:00:00')).amount).toBe(500)
})

test('partial refund inside the window', () => {
  expect(computeRefund(base, mockSettings, new Date('2026-06-10T04:00:00')).amount).toBe(250)
})

test('nothing refundable when unpaid', () => {
  expect(computeRefund({ ...base, paymentStatus: 'PENDING' }, mockSettings).amount).toBe(0)
})

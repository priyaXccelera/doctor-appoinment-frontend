import type { Appointment, PlatformSettings } from '../types'
import { appointmentStart } from './format'

export interface RefundPreview {
  amount: number
  percent: number
  note: string
}

export function computeRefund(appointment: Appointment, settings: PlatformSettings, now = new Date()): RefundPreview {
  if (appointment.paymentStatus !== 'PAID') {
    return { amount: 0, percent: 0, note: 'No online payment was made, so nothing is refundable.' }
  }
  const hoursLeft = (appointmentStart(appointment.date, appointment.startTime).getTime() - now.getTime()) / 3600000
  if (hoursLeft >= settings.cancellationWindowHours) {
    return { amount: appointment.fee, percent: 100, note: `Free cancellation: more than ${settings.cancellationWindowHours} hours before the appointment.` }
  }
  const amount = Math.round((appointment.fee * settings.refundPercent) / 100)
  return {
    amount,
    percent: settings.refundPercent,
    note: `Late cancellation (within ${settings.cancellationWindowHours} hours): ${settings.refundPercent}% refund.`,
  }
}

import type { Appointment } from '../types'
import { downloadTextFile } from './format'

function stamp(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

export function downloadCalendarFile(appointment: Appointment): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediBook//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@medibook`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(appointment.date, appointment.startTime)}`,
    `DTEND:${stamp(appointment.date, appointment.endTime)}`,
    `SUMMARY:Appointment with ${appointment.doctor.name}`,
    `LOCATION:${appointment.mode === 'VIDEO' ? 'Video consultation' : appointment.clinic.address}`,
    `DESCRIPTION:Reference ${appointment.referenceNo}. Times are in the doctor's local time.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  downloadTextFile(`appointment-${appointment.referenceNo}.ics`, lines.join('\r\n'), 'text/calendar')
}

export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

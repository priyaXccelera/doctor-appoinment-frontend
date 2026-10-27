import { ApiError, remote, remoteList } from '../api/client'
import { currentUser } from '../auth/auth'
import { loadList, newId, saveList } from './collection'
import { buildMockPayments, mockReviews } from './mockData'
import {
  cancelAppointment,
  internals,
  loadAvailability,
  prescriptionsAll,
  saveAvailability,
} from './store'
import type {
  Appointment,
  AppointmentStatus,
  Availability,
  Doctor,
  Leave,
  Override,
  Payment,
  Prescription,
  Review,
} from '../types'
import { addDaysISO, todayISO } from '../utils/format'
import { findConflicts } from '../utils/slots'

// TODO(USE_MOCK): verify path + response shape against the real
// backend's OpenAPI schema before flipping this to false.
export const USE_MOCK = import.meta.env.VITE_DEMO_MODE !== 'false'

export function myDoctorId(): string {
  return currentUser()?.doctorId ?? ''
}

function doctorAppointmentsLocal(): Appointment[] {
  return internals
    .appointmentsAll()
    .filter((appointment) => appointment.doctorId === myDoctorId())
    .sort((first, second) => `${first.date}${first.startTime}`.localeCompare(`${second.date}${second.startTime}`))
}

/* ------------------------------ profile ------------------------------ */

export async function getDoctorProfile(): Promise<Doctor | undefined> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /doctor/profile
    return internals.doctorsAll().find((doctor) => doctor.id === myDoctorId())
  }
  return remote<Doctor>('get', '/doctor/profile')
}

export async function updateDoctorProfile(patch: Partial<Doctor>): Promise<Doctor> {
  if (!USE_MOCK) return remote<Doctor>('put', '/doctor/profile', patch)
  // MOCK: stands in for PUT /doctor/profile
  const all = internals.doctorsAll()
  const doctor = all.find((item) => item.id === myDoctorId())
  if (!doctor) throw new ApiError('NOT_FOUND', 'Doctor profile not found', 404)
  Object.assign(doctor, patch)
  saveList('doctors', all)
  return doctor
}

export async function uploadDoctorDocument(fileName: string): Promise<Doctor> {
  if (!USE_MOCK) return remote<Doctor>('post', '/doctor/documents', { fileName })
  // MOCK: stands in for POST /doctor/documents (multipart); resets verification to PENDING
  const doctor = await getDoctorProfile()
  if (!doctor) throw new ApiError('NOT_FOUND', 'Doctor profile not found', 404)
  return updateDoctorProfile({
    documents: [...doctor.documents, fileName],
    verification: 'PENDING',
    verificationReason: undefined,
  })
}

/* ------------------------------ appointments ------------------------------ */

export async function getDoctorAppointments(): Promise<Appointment[]> {
  if (USE_MOCK) return doctorAppointmentsLocal() // MOCK: stands in for GET /doctor/appointments
  const { data } = await remoteList<Appointment[]>('/doctor/appointments', { pageSize: 200 })
  return data
}

export async function getDoctorAppointment(id: string): Promise<Appointment | undefined> {
  if (USE_MOCK) return internals.appointmentsAll().find((item) => item.id === id) // MOCK: GET /doctor/appointments/:id
  return remote<Appointment>('get', `/doctor/appointments/${id}`)
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus, reason = ''): Promise<Appointment> {
  if (status === 'CANCELLED_BY_DOCTOR') return cancelAppointment(id, reason, true)
  if (!USE_MOCK) return remote<Appointment>('patch', `/doctor/appointments/${id}/status`, { status, reason })
  // MOCK: stands in for PATCH /doctor/appointments/:id/status
  const labels: Partial<Record<AppointmentStatus, string>> = {
    CONFIRMED: 'Confirmed by doctor',
    IN_PROGRESS: 'Consultation started',
    COMPLETED: 'Consultation completed',
    NO_SHOW: 'Marked as no-show',
  }
  const updated = internals.patchAppointment(id, (item) => {
    item.status = status
    item.history.push({ action: labels[status] ?? status, actor: item.doctor.name, timestamp: new Date().toISOString(), note: reason })
    if (status === 'COMPLETED') item.followUpEligible = true
  })
  internals.pushNotification(updated.patientUserId, 'APPOINTMENT', `Appointment ${updated.referenceNo}: ${labels[status] ?? status}.`)
  return updated
}

export async function addAppointmentNote(id: string, notes: string): Promise<Appointment> {
  if (!USE_MOCK) return remote<Appointment>('post', `/doctor/appointments/${id}/notes`, { notes })
  // MOCK: stands in for POST /doctor/appointments/:id/notes
  return internals.patchAppointment(id, (item) => {
    item.notes = notes
  })
}

export interface PrescriptionPayload {
  diagnosis: string
  medicines: Prescription['medicines']
  tests: string[]
  advice: string
  followUpDate: string
}

export async function issuePrescription(appointmentId: string, payload: PrescriptionPayload): Promise<Prescription> {
  if (!USE_MOCK) return remote<Prescription>('post', `/doctor/appointments/${appointmentId}/prescription`, payload)
  // MOCK: stands in for POST /doctor/appointments/:id/prescription
  const appointment = internals.appointmentsAll().find((item) => item.id === appointmentId)
  if (!appointment) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
  const prescription: Prescription = {
    ...payload,
    id: newId('rx'),
    appointmentId,
    patientUserId: appointment.patientUserId,
    patientName: appointment.patient.name,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctor.name,
    appointmentDate: appointment.date,
    issuedAt: new Date().toISOString(),
  }
  saveList('prescriptions', [prescription, ...prescriptionsAll()])
  internals.patchAppointment(appointmentId, (item) => {
    item.prescriptionId = prescription.id
    item.history.push({ action: 'Prescription issued', actor: item.doctor.name, timestamp: new Date().toISOString() })
  })
  internals.pushNotification(appointment.patientUserId, 'PRESCRIPTION', `Prescription issued by ${appointment.doctor.name}.`)
  return prescription
}

/* ------------------------------ patients ------------------------------ */

export interface PatientSummary {
  patientUserId: string
  name: string
  lastVisit: string
  totalVisits: number
  age: number
  gender: string
}

export async function getDoctorPatients(): Promise<PatientSummary[]> {
  if (!USE_MOCK) return remote<PatientSummary[]>('get', '/doctor/patients')
  // MOCK: stands in for GET /doctor/patients
  const map = new Map<string, PatientSummary>()
  doctorAppointmentsLocal()
    .filter((item) => item.status !== 'EXPIRED')
    .forEach((item) => {
      const existing = map.get(item.patientUserId)
      const visited = item.status === 'COMPLETED'
      map.set(item.patientUserId, {
        patientUserId: item.patientUserId,
        name: existing?.name ?? item.patient.name,
        age: item.patientInfo.age,
        gender: item.patientInfo.gender,
        lastVisit: visited && (!existing || item.date > existing.lastVisit) ? item.date : (existing?.lastVisit ?? ''),
        totalVisits: (existing?.totalVisits ?? 0) + (visited ? 1 : 0),
      })
    })
  return [...map.values()]
}

export async function getPatientHistory(patientUserId: string) {
  if (!USE_MOCK) return remote<{ appointments: Appointment[]; prescriptions: Prescription[] }>('get', `/doctor/patients/${patientUserId}/history`)
  // MOCK: stands in for GET /doctor/patients/:id/history
  return {
    appointments: doctorAppointmentsLocal()
      .filter((item) => item.patientUserId === patientUserId)
      .sort((first, second) => second.date.localeCompare(first.date)),
    prescriptions: prescriptionsAll().filter((item) => item.patientUserId === patientUserId && item.doctorId === myDoctorId()),
  }
}

/* ------------------------------ reviews ------------------------------ */

export async function getMyReviews(): Promise<Review[]> {
  if (!USE_MOCK) return remote<Review[]>('get', `/doctors/${myDoctorId()}/reviews`)
  // MOCK: stands in for GET /doctors/:id/reviews for the signed-in doctor
  return loadList<Review>('reviews', () => mockReviews).filter(
    (review) => review.doctorId === myDoctorId() && review.moderation !== 'REJECTED',
  )
}

export async function replyToReview(id: string, reply: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('post', `/doctor/reviews/${id}/reply`, { reply })
    return
  }
  // MOCK: stands in for POST /doctor/reviews/:id/reply
  const all = loadList<Review>('reviews', () => mockReviews)
  all.forEach((review) => {
    if (review.id === id) review.reply = reply
  })
  saveList('reviews', all)
}

/* ------------------------------ dashboard + earnings ------------------------------ */

export interface DoctorDashboard {
  today: Appointment[]
  todayCount: number
  upcomingCount: number
  completedThisWeek: number
  earningsThisMonth: number
  nextPatient: Appointment | null
  recentReviews: Review[]
}

export async function getDoctorDashboard(): Promise<DoctorDashboard> {
  if (!USE_MOCK) return remote<DoctorDashboard>('get', '/doctor/dashboard')
  // MOCK: stands in for GET /doctor/dashboard (computed locally)
  const all = doctorAppointmentsLocal()
  const today = todayISO()
  const weekAgo = addDaysISO(today, -7)
  const todays = all.filter((item) => item.date === today && !item.status.startsWith('CANCELLED'))
  const nowTime = new Date().toTimeString().slice(0, 5)
  const earnings = await getEarnings(addDaysISO(today, -30), today)
  return {
    today: todays,
    todayCount: todays.length,
    upcomingCount: all.filter((item) => item.date > today && ['CONFIRMED', 'PENDING_PAYMENT', 'RESCHEDULED'].includes(item.status)).length,
    completedThisWeek: all.filter((item) => item.status === 'COMPLETED' && item.date >= weekAgo && item.date <= today).length,
    earningsThisMonth: earnings.reduce((sum, row) => sum + row.net, 0),
    nextPatient:
      todays.find((item) => ['CONFIRMED', 'IN_PROGRESS'].includes(item.status) && item.startTime >= nowTime) ??
      todays.find((item) => item.status === 'IN_PROGRESS' || item.status === 'CONFIRMED') ??
      null,
    recentReviews: (await getMyReviews()).slice(0, 5),
  }
}

export interface EarningRow {
  paymentId: string
  date: string
  referenceNo: string
  patient: string
  fee: number
  commission: number
  net: number
  status: string
}

export async function getEarnings(from: string, to: string): Promise<EarningRow[]> {
  if (!USE_MOCK) return remote<EarningRow[]>('get', '/doctor/earnings', undefined, { from, to })
  // MOCK: stands in for GET /doctor/earnings
  const appointments = internals.appointmentsAll()
  return loadList<Payment>('payments', buildMockPayments)
    .filter((payment) => payment.doctorId === myDoctorId() && payment.date >= from && payment.date <= to)
    .map((payment) => ({
      paymentId: payment.id,
      date: payment.date,
      referenceNo: payment.referenceNo,
      patient: appointments.find((item) => item.id === payment.appointmentId)?.patient.name ?? '-',
      fee: payment.amount,
      commission: payment.commission,
      net: payment.status === 'PAID' ? payment.amount - payment.commission : 0,
      status: payment.status,
    }))
}

/* ------------------------------ availability ------------------------------ */

export async function getAvailability(): Promise<Availability> {
  if (USE_MOCK) return loadAvailability(myDoctorId()) // MOCK: stands in for GET /doctor/availability
  return remote<Availability>('get', '/doctor/availability')
}

export async function saveWeeklySchedule(weekly: Availability['weekly']): Promise<Availability> {
  if (!USE_MOCK) return remote<Availability>('put', '/doctor/availability', { weekly })
  // MOCK: stands in for PUT /doctor/availability
  const availability = { ...loadAvailability(myDoctorId()), weekly }
  saveAvailability(availability)
  return availability
}

export function countLeaveConflicts(leave: { fromDate: string; toDate: string }): number {
  return findConflicts(leave, doctorAppointmentsLocal())
}

export async function addLeave(input: Omit<Leave, 'id'>): Promise<Availability> {
  if (!USE_MOCK) return remote<Availability>('post', '/doctor/leaves', input)
  // MOCK: stands in for POST /doctor/leaves
  const availability = loadAvailability(myDoctorId())
  availability.leaves.push({ ...input, id: newId('leave') })
  saveAvailability(availability)
  return availability
}

export async function deleteLeave(id: string): Promise<Availability> {
  if (!USE_MOCK) {
    await remote('delete', `/doctor/leaves/${id}`)
    return getAvailability()
  }
  // MOCK: stands in for DELETE /doctor/leaves/:id
  const availability = loadAvailability(myDoctorId())
  availability.leaves = availability.leaves.filter((leave) => leave.id !== id)
  saveAvailability(availability)
  return availability
}

export async function addOverride(input: Omit<Override, 'id'>): Promise<Availability> {
  if (!USE_MOCK) return remote<Availability>('post', '/doctor/overrides', input)
  // MOCK: stands in for POST /doctor/overrides
  const availability = loadAvailability(myDoctorId())
  availability.overrides = [...availability.overrides.filter((item) => item.date !== input.date), { ...input, id: newId('ovr') }]
  saveAvailability(availability)
  return availability
}

export async function deleteOverride(id: string): Promise<Availability> {
  // MOCK: no delete-override endpoint in the contract; removes locally only
  const availability = loadAvailability(myDoctorId())
  availability.overrides = availability.overrides.filter((item) => item.id !== id)
  saveAvailability(availability)
  return availability
}

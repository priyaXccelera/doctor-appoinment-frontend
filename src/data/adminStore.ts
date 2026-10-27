import { ApiError, remote } from '../api/client'
import { getUsers } from '../auth/auth'
import { loadList, loadObject, newId, saveList, saveObject } from './collection'
import { buildMockPayments, mockRefunds, mockReviews, mockSettings } from './mockData'
import { getMaster, internals, paymentsAll } from './store'
import type {
  Appointment,
  Doctor,
  MasterItem,
  MasterType,
  Payment,
  PlatformSettings,
  Refund,
  Review,
  Role,
  User,
  VerificationStatus,
} from '../types'
import { addDaysISO, formatDate } from '../utils/format'

// TODO(USE_MOCK): verify path + response shape against the real
// backend's OpenAPI schema before flipping this to false.
export const USE_MOCK = import.meta.env.VITE_DEMO_MODE !== 'false'

/* ------------------------------ doctor verification ------------------------------ */

export async function getAdminDoctors(status?: VerificationStatus): Promise<Doctor[]> {
  if (!USE_MOCK) return remote<Doctor[]>('get', '/admin/doctors', undefined, { status })
  // MOCK: stands in for GET /admin/doctors?status=
  return internals.doctorsAll().filter((doctor) => !status || doctor.verification === status)
}

export async function setDoctorVerification(id: string, status: VerificationStatus, reason = ''): Promise<void> {
  if (!USE_MOCK) {
    await remote('patch', `/admin/doctors/${id}/verification`, { status, reason })
    return
  }
  // MOCK: stands in for PATCH /admin/doctors/:id/verification
  const all = internals.doctorsAll()
  all.forEach((doctor) => {
    if (doctor.id === id) {
      doctor.verification = status
      doctor.verificationReason = reason || undefined
    }
  })
  saveList('doctors', all)
}

/* ------------------------------ master data ------------------------------ */

export async function createMasterItem(type: MasterType, name: string, extra = ''): Promise<MasterItem> {
  if (!USE_MOCK) return remote<MasterItem>('post', `/admin/master/${type}`, { name, extra })
  // MOCK: stands in for POST /admin/master/:type
  const items = await getMaster(type)
  const item: MasterItem = { id: newId(type.slice(0, 2)), name, extra }
  saveList(`master_${type}`, [...items, item])
  return item
}

export async function updateMasterItem(type: MasterType, id: string, name: string, extra = ''): Promise<void> {
  if (!USE_MOCK) {
    await remote('put', `/admin/master/${type}/${id}`, { name, extra })
    return
  }
  // MOCK: stands in for PUT /admin/master/:type/:id
  const items = await getMaster(type)
  items.forEach((item) => {
    if (item.id === id) Object.assign(item, { name, extra })
  })
  saveList(`master_${type}`, items)
}

export async function deleteMasterItem(type: MasterType, id: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('delete', `/admin/master/${type}/${id}`)
    return
  }
  // MOCK: stands in for DELETE /admin/master/:type/:id
  const items = await getMaster(type)
  saveList(`master_${type}`, items.filter((item) => item.id !== id))
}

/* ------------------------------ users ------------------------------ */

export async function getAdminUsers(role?: Role): Promise<User[]> {
  if (!USE_MOCK) return remote<User[]>('get', '/admin/users', undefined, { role })
  // MOCK: stands in for GET /admin/users
  return getUsers().filter((user) => !role || user.role === role)
}

export async function setUserStatus(id: string, status: User['status']): Promise<void> {
  if (!USE_MOCK) {
    await remote('patch', `/admin/users/${id}/status`, { status })
    return
  }
  // MOCK: stands in for PATCH /admin/users/:id/status
  const users = getUsers()
  users.forEach((user) => {
    if (user.id === id) user.status = status
  })
  saveList('users', users)
}

/* ------------------------------ refunds ------------------------------ */

export async function getRefunds(): Promise<Refund[]> {
  if (USE_MOCK) return loadList<Refund>('refunds', () => mockRefunds) // MOCK: GET /admin/refunds
  return remote<Refund[]>('get', '/admin/refunds')
}

export async function updateRefund(id: string, action: 'APPROVE' | 'PROCESS' | 'REJECT', amount: number, reason: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('post', `/admin/refunds/${id}`, { amount, reason, action })
    return
  }
  // MOCK: stands in for POST /admin/refunds/:paymentId
  const all = loadList<Refund>('refunds', () => mockRefunds)
  const refund = all.find((item) => item.id === id)
  if (!refund) throw new ApiError('NOT_FOUND', 'Refund not found', 404)
  refund.amount = amount
  refund.reason = reason
  refund.status = action === 'APPROVE' ? 'APPROVED' : action === 'PROCESS' ? 'PROCESSED' : 'REJECTED'
  saveList('refunds', all)
}

/* ------------------------------ review moderation ------------------------------ */

export async function getModerationReviews(): Promise<Review[]> {
  if (USE_MOCK) return loadList<Review>('reviews', () => mockReviews) // MOCK: GET /admin/reviews/moderation
  return remote<Review[]>('get', '/admin/reviews/moderation')
}

export async function moderateReview(id: string, action: 'APPROVE' | 'REJECT', reason = ''): Promise<void> {
  if (!USE_MOCK) {
    await remote('patch', `/admin/reviews/${id}`, { action, reason })
    return
  }
  // MOCK: stands in for PATCH /admin/reviews/:id
  const all = loadList<Review>('reviews', () => mockReviews)
  all.forEach((review) => {
    if (review.id === id) review.moderation = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  })
  saveList('reviews', all)
}

/* ------------------------------ settings ------------------------------ */

export async function saveSettings(settings: PlatformSettings): Promise<PlatformSettings> {
  if (!USE_MOCK) return remote<PlatformSettings>('put', '/admin/settings', settings)
  // MOCK: stands in for PUT /admin/settings
  saveObject('settings', settings)
  return loadObject('settings', () => mockSettings)
}

/* ------------------------------ analytics + reports ------------------------------ */

function syntheticBase(date: string, salt: number): number {
  let hash = salt
  for (let index = 0; index < date.length; index += 1) hash = (hash * 31 + date.charCodeAt(index)) % 997
  // MOCK: synthetic baseline so charts are populated before real bookings exist
  return 8 + (hash % 14)
}

export interface AdminAnalytics {
  bookings: { date: string; bookings: number }[]
  revenue: { date: string; revenue: number; commission: number }[]
  topDoctors: { name: string; bookings: number }[]
  specialtyDemand: { name: string; value: number }[]
  cancellationRate: number
  noShowRate: number
  totals: { bookings: number; revenue: number; commission: number }
}

export async function getAdminAnalytics(from: string, to: string): Promise<AdminAnalytics> {
  if (!USE_MOCK) return remote<AdminAnalytics>('get', '/admin/reports', undefined, { type: 'dashboard', from, to })
  // MOCK: stands in for GET /admin/reports (dashboard analytics)
  const appointments = internals.appointmentsAll()
  const settings = internals.localSettings()
  const bookings: AdminAnalytics['bookings'] = []
  const revenue: AdminAnalytics['revenue'] = []
  let cursor = from
  let guard = 0
  while (cursor <= to && guard < 120) {
    const real = appointments.filter((item) => item.createdAt.slice(0, 10) === cursor).length
    const count = syntheticBase(cursor, 3) + real
    bookings.push({ date: cursor, bookings: count })
    const gross = count * 620
    revenue.push({ date: cursor, revenue: gross, commission: Math.round((gross * settings.commissionPercent) / 100) })
    cursor = addDaysISO(cursor, 1)
    guard += 1
  }
  const demand = new Map<string, number>()
  const perDoctor = new Map<string, number>()
  appointments.forEach((item) => {
    item.doctor.specialties.forEach((name) => demand.set(name, (demand.get(name) ?? 0) + 1))
    perDoctor.set(item.doctor.name, (perDoctor.get(item.doctor.name) ?? 0) + 1)
  })
  const cancelled = appointments.filter((item) => item.status.startsWith('CANCELLED')).length
  const noShow = appointments.filter((item) => item.status === 'NO_SHOW').length
  return {
    bookings,
    revenue,
    topDoctors: [...perDoctor.entries()].map(([name, value]) => ({ name, bookings: value * 12 })).sort((a, b) => b.bookings - a.bookings).slice(0, 5),
    specialtyDemand: [...demand.entries()].map(([name, value]) => ({ name, value: value * 9 })),
    cancellationRate: appointments.length ? Math.round((cancelled / appointments.length) * 100) : 0,
    noShowRate: appointments.length ? Math.round((noShow / appointments.length) * 100) : 0,
    totals: {
      bookings: bookings.reduce((sum, row) => sum + row.bookings, 0),
      revenue: revenue.reduce((sum, row) => sum + row.revenue, 0),
      commission: revenue.reduce((sum, row) => sum + row.commission, 0),
    },
  }
}

export type ReportType = 'bookings' | 'revenue' | 'commissions' | 'cancellations' | 'no-shows'

export interface ReportResult {
  columns: string[]
  rows: (string | number)[][]
}

export async function getReport(type: ReportType, from: string, to: string): Promise<ReportResult> {
  if (!USE_MOCK) return remote<ReportResult>('get', '/admin/reports', undefined, { type, from, to })
  // MOCK: stands in for GET /admin/reports?type=&from=&to=
  const inRange = (appointment: Appointment) => appointment.date >= from && appointment.date <= to
  const appointments = internals.appointmentsAll().filter(inRange)
  const payments = paymentsAll().filter((payment: Payment) => payment.date >= from && payment.date <= to)
  void buildMockPayments
  if (type === 'revenue' || type === 'commissions') {
    return {
      columns: ['Date', 'Reference', 'Doctor', 'Amount (INR)', 'Commission (INR)', 'Status'],
      rows: payments.map((item) => [formatDate(item.date), item.referenceNo, item.doctorName, item.amount, item.commission, item.status]),
    }
  }
  const filtered =
    type === 'cancellations'
      ? appointments.filter((item) => item.status.startsWith('CANCELLED'))
      : type === 'no-shows'
        ? appointments.filter((item) => item.status === 'NO_SHOW')
        : appointments
  return {
    columns: ['Date', 'Reference', 'Doctor', 'Patient', 'Mode', 'Status', 'Fee (INR)'],
    rows: filtered.map((item) => [formatDate(item.date), item.referenceNo, item.doctor.name, item.patient.name, item.mode, item.status, item.fee]),
  }
}

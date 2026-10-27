import { ApiError, remote, remoteList } from '../api/client'
import { currentUser, getUsers } from '../auth/auth'
import { loadList, loadObject, newId, saveList, saveObject } from './collection'
import {
  buildMockAppointments,
  buildMockNotifications,
  buildMockPayments,
  buildMockPrescriptions,
  canChange,
  defaultAvailability,
  mockCities,
  mockDoctors,
  mockFamilyMembers,
  mockRefunds,
  mockReviews,
  mockSettings,
  mockSpecialties,
  mockSymptoms,
} from './mockData'
import type {
  Appointment,
  Availability,
  Doctor,
  DoctorListItem,
  FamilyMember,
  Hold,
  MasterItem,
  MasterType,
  MedicalRecord,
  Mode,
  NextSlot,
  NotificationItem,
  NotificationPrefs,
  Payment,
  PlatformSettings,
  Prescription,
  Refund,
  Review,
  SearchParams,
  SearchResult,
  SlotDay,
  User,
} from '../types'
import { addDaysISO, todayISO } from '../utils/format'
import { buildSlotRange, buildSlotsForDate, slotKey } from '../utils/slots'
import type { SlotContext } from '../utils/slots'
import { computeRefund } from '../utils/refund'

// TODO(USE_MOCK): verify path + response shape against the real
// backend's OpenAPI schema before flipping this to false.
export const USE_MOCK = import.meta.env.VITE_DEMO_MODE !== 'false'

const ACTIVE_STATUSES = ['CONFIRMED', 'PENDING_PAYMENT', 'RESCHEDULED', 'IN_PROGRESS', 'COMPLETED']

function userId(): string {
  return currentUser()?.id ?? ''
}

function appointmentsAll(): Appointment[] {
  return loadList<Appointment>('appointments', buildMockAppointments)
}

function doctorsAll(): Doctor[] {
  return loadList<Doctor>('doctors', () => mockDoctors)
}

export function loadAvailability(doctorId: string): Availability {
  const all = loadList<Availability>('availability', () => [])
  return all.find((item) => item.doctorId === doctorId) ?? defaultAvailability(doctorId)
}

export function saveAvailability(availability: Availability): void {
  const all = loadList<Availability>('availability', () => [])
  saveList('availability', [...all.filter((item) => item.doctorId !== availability.doctorId), availability])
}

function holdsAll(): Hold[] {
  return loadList<Hold>('holds', () => []).filter((hold) => new Date(hold.expiresAt).getTime() > Date.now())
}

function localSettings(): PlatformSettings {
  return loadObject<PlatformSettings>('settings', () => mockSettings)
}

function slotContext(doctorId: string, mode: Mode, clinicId?: string, ignoreHoldId?: string): SlotContext {
  const booked = new Set<string>()
  appointmentsAll()
    .filter((appointment) => ACTIVE_STATUSES.includes(appointment.status) && appointment.doctorId === doctorId)
    .forEach((appointment) => booked.add(slotKey(doctorId, appointment.date, appointment.startTime)))
  holdsAll()
    .filter((hold) => hold.doctorId === doctorId && hold.holdId !== ignoreHoldId && hold.userId !== userId())
    .forEach((hold) => booked.add(slotKey(doctorId, hold.date, hold.startTime)))
  return {
    doctorId,
    availability: loadAvailability(doctorId),
    bookedKeys: booked,
    mode,
    clinicId,
    leadTimeHours: localSettings().leadTimeHours,
  }
}

function findNextSlot(doctorId: string, from: string, days: number, mode?: Mode): NextSlot | null {
  const modes: Mode[] = mode ? [mode] : ['CLINIC', 'VIDEO']
  for (let offset = 0; offset < days; offset += 1) {
    const date = addDaysISO(from, offset)
    for (const candidate of modes) {
      const slot = buildSlotsForDate(date, slotContext(doctorId, candidate)).find((item) => item.available)
      if (slot) return { date, startTime: slot.startTime, mode: candidate }
    }
  }
  return null
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function pushNotification(targetUserId: string, type: NotificationItem['type'], message: string) {
  const all = loadList<NotificationItem>('notifications', buildMockNotifications)
  all.unshift({ id: newId('n'), userId: targetUserId, type, message, createdAt: new Date().toISOString(), read: false })
  saveList('notifications', all)
}

function patchAppointment(id: string, mutate: (appointment: Appointment) => void): Appointment {
  const all = appointmentsAll()
  const appointment = all.find((item) => item.id === id)
  if (!appointment) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
  mutate(appointment)
  appointment.canCancel = canChange(appointment.status)
  appointment.canReschedule = canChange(appointment.status)
  appointment.videoLinkAvailable = appointment.mode === 'VIDEO' && appointment.status === 'CONFIRMED'
  saveList('appointments', all)
  return appointment
}

/* ------------------------------ master data ------------------------------ */

function masterSeed(type: MasterType): MasterItem[] {
  if (type === 'specialties') return mockSpecialties
  if (type === 'symptoms') return mockSymptoms
  return mockCities
}

// MOCK: stands in for GET /master/:type
function localGetMaster(type: MasterType): MasterItem[] {
  return loadList<MasterItem>(`master_${type}`, () => masterSeed(type))
}

export async function getMaster(type: MasterType): Promise<MasterItem[]> {
  if (USE_MOCK) return localGetMaster(type)
  return remote<MasterItem[]>('get', `/master/${type}`)
}

export async function getSpecialties() {
  return getMaster('specialties')
}
export async function getCities() {
  return getMaster('cities')
}
export async function getSymptoms() {
  return getMaster('symptoms')
}

/* ------------------------------ doctors ------------------------------ */

// MOCK: stands in for GET /doctors/search (filters, facets, sorting, pagination)
function localSearchDoctors(params: SearchParams): SearchResult {
  const today = todayISO()
  const needle = (params.q ?? '').trim().toLowerCase()
  const symptomSpecialties = localGetMaster('symptoms')
    .filter((symptom) => needle && symptom.name.toLowerCase().includes(needle))
    .map((symptom) => symptom.extra)
  const cityCenter = localGetMaster('cities').find((city) => city.name === params.city)
  const [centerLat, centerLng] = (cityCenter?.extra ?? '').split(',').map(Number)

  const base = doctorsAll().filter((doctor) => {
    if (doctor.verification !== 'VERIFIED') return false
    if (params.city && !doctor.clinics.some((clinic) => clinic.city === params.city)) return false
    if (needle) {
      const haystack = [
        doctor.name,
        ...doctor.specialties,
        ...doctor.clinics.flatMap((clinic) => [clinic.name, clinic.locality]),
      ]
        .join(' ')
        .toLowerCase()
      const matchesSymptom = doctor.specialties.some((specialty) => symptomSpecialties.includes(specialty))
      if (!haystack.includes(needle) && !matchesSymptom) return false
    }
    return true
  })

  const withSlots: DoctorListItem[] = base.map((doctor) => ({
    ...doctor,
    nextAvailableSlot: findNextSlot(doctor.id, today, 14, params.mode as Mode | undefined),
  }))

  const filtered = withSlots.filter((doctor) => {
    const fee = params.mode === 'VIDEO' ? doctor.consultationFees.video : doctor.consultationFees.clinic
    if (params.specialty && !doctor.specialties.includes(params.specialty)) return false
    if (params.locality && !doctor.clinics.some((clinic) => clinic.locality === params.locality)) return false
    if (params.mode && !doctor.modes.includes(params.mode as Mode)) return false
    if (params.feeMin !== undefined && fee < params.feeMin) return false
    if (params.feeMax !== undefined && fee > params.feeMax) return false
    if (params.experienceMin !== undefined && doctor.experienceYears < params.experienceMin) return false
    if (params.gender && doctor.gender !== params.gender) return false
    if (params.language && !doctor.languages.includes(params.language)) return false
    if (params.ratingMin !== undefined && doctor.rating < params.ratingMin) return false
    if (params.radiusKm && centerLat) {
      const near = doctor.clinics.some(
        (clinic) => distanceKm(centerLat, centerLng, clinic.lat, clinic.lng) <= params.radiusKm!,
      )
      if (!near) return false
    }
    if (params.availability) {
      const days = params.availability === 'today' ? 1 : params.availability === 'tomorrow' ? 2 : 7
      const start = params.availability === 'tomorrow' ? addDaysISO(today, 1) : today
      const span = params.availability === 'tomorrow' ? 1 : days
      if (!findNextSlot(doctor.id, start, span, params.mode as Mode | undefined)) return false
    }
    return true
  })

  const feeOf = (doctor: DoctorListItem) => doctor.consultationFees[params.mode === 'VIDEO' ? 'video' : 'clinic']
  const earliestKey = (doctor: DoctorListItem) =>
    doctor.nextAvailableSlot ? `${doctor.nextAvailableSlot.date} ${doctor.nextAvailableSlot.startTime}` : '9999'
  const sorted = [...filtered].sort((first, second) => {
    switch (params.sort) {
      case 'rating':
        return second.rating - first.rating
      case 'experience':
        return second.experienceYears - first.experienceYears
      case 'fee':
        return feeOf(first) - feeOf(second)
      case 'earliest':
        return earliestKey(first).localeCompare(earliestKey(second))
      default:
        return second.rating * Math.log(second.reviewCount + 2) - first.rating * Math.log(first.reviewCount + 2)
    }
  })

  const facets: SearchResult['facets'] = { specialty: {}, mode: {}, gender: {}, language: {} }
  withSlots.forEach((doctor) => {
    doctor.specialties.forEach((item) => (facets.specialty[item] = (facets.specialty[item] ?? 0) + 1))
    doctor.modes.forEach((item) => (facets.mode[item] = (facets.mode[item] ?? 0) + 1))
    facets.gender[doctor.gender] = (facets.gender[doctor.gender] ?? 0) + 1
    doctor.languages.forEach((item) => (facets.language[item] = (facets.language[item] ?? 0) + 1))
  })

  const pageSize = params.pageSize ?? 6
  const page = params.page ?? 1
  return { items: sorted.slice((page - 1) * pageSize, page * pageSize), total: sorted.length, facets }
}

export async function searchDoctors(params: SearchParams): Promise<SearchResult> {
  if (USE_MOCK) return localSearchDoctors(params)
  const { data, meta } = await remoteList<DoctorListItem[]>('/doctors/search', { ...params })
  return { items: data, total: meta.total, facets: (meta.facets as SearchResult['facets']) ?? { specialty: {}, mode: {}, gender: {}, language: {} } }
}

// MOCK: stands in for GET /doctors/:id
function localGetDoctor(id: string): Doctor | undefined {
  return doctorsAll().find((doctor) => doctor.id === id)
}

export async function getDoctor(id: string): Promise<Doctor | undefined> {
  if (USE_MOCK) return localGetDoctor(id)
  return remote<Doctor>('get', `/doctors/${id}`)
}

export async function getTopDoctors(): Promise<DoctorListItem[]> {
  const result = await searchDoctors({ sort: 'rating', pageSize: 8 })
  return result.items
}

// MOCK: stands in for GET /doctors/:id/slots
function localGetSlots(doctorId: string, from: string, to: string, mode: Mode, clinicId?: string): SlotDay[] {
  return buildSlotRange(from, to, slotContext(doctorId, mode, clinicId))
}

export async function getSlots(doctorId: string, from: string, to: string, mode: Mode, clinicId?: string): Promise<SlotDay[]> {
  if (USE_MOCK) return localGetSlots(doctorId, from, to, mode, clinicId)
  return remote<SlotDay[]>('get', `/doctors/${doctorId}/slots`, undefined, { from, to, mode, clinicId })
}

export async function getNextAvailable(doctorId: string, mode: Mode): Promise<NextSlot | null> {
  if (USE_MOCK) return findNextSlot(doctorId, todayISO(), 30, mode)
  const days = await getSlots(doctorId, todayISO(), addDaysISO(todayISO(), 30), mode)
  const day = days.find((item) => item.slots.some((slot) => slot.available))
  const slot = day?.slots.find((item) => item.available)
  return day && slot ? { date: day.date, startTime: slot.startTime, mode } : null
}

// MOCK: stands in for GET /doctors/:id/reviews
function localGetDoctorReviews(doctorId: string, page: number, pageSize: number) {
  const all = loadList<Review>('reviews', () => mockReviews).filter(
    (review) => review.doctorId === doctorId && review.moderation === 'APPROVED',
  )
  return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length, all }
}

export async function getDoctorReviews(doctorId: string, page = 1, pageSize = 5) {
  if (USE_MOCK) return localGetDoctorReviews(doctorId, page, pageSize)
  const { data, meta } = await remoteList<Review[]>(`/doctors/${doctorId}/reviews`, { page, pageSize })
  return { items: data, total: meta.total, all: data }
}

// MOCK: stands in for GET /suggestions?type=&q=
function localGetSuggestions(q: string): { type: string; label: string; value: string }[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return []
  const result: { type: string; label: string; value: string }[] = []
  doctorsAll()
    .filter((doctor) => doctor.verification === 'VERIFIED' && doctor.name.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((doctor) => result.push({ type: 'doctor', label: doctor.name, value: doctor.name }))
  localGetMaster('specialties')
    .filter((item) => item.name.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((item) => result.push({ type: 'specialty', label: item.name, value: item.name }))
  localGetMaster('symptoms')
    .filter((item) => item.name.toLowerCase().includes(needle))
    .slice(0, 3)
    .forEach((item) => result.push({ type: 'symptom', label: item.name, value: item.name }))
  mockDoctors
    .flatMap((doctor) => doctor.clinics)
    .filter((clinic, index, list) => list.findIndex((other) => other.id === clinic.id) === index)
    .filter((clinic) => clinic.name.toLowerCase().includes(needle))
    .slice(0, 2)
    .forEach((clinic) => result.push({ type: 'clinic', label: clinic.name, value: clinic.name }))
  return result
}

export async function getSuggestions(q: string) {
  if (USE_MOCK) return localGetSuggestions(q)
  return remote<{ type: string; label: string; value: string }[]>('get', '/suggestions', undefined, { q })
}

/* ------------------------------ settings ------------------------------ */

export async function getSettings(): Promise<PlatformSettings> {
  if (USE_MOCK) return localSettings()
  return remote<PlatformSettings>('get', '/admin/settings')
}

/* ------------------------------ patient profile ------------------------------ */

// MOCK: stands in for GET /patient/profile
function localGetProfile(): User | undefined {
  return getUsers().find((user) => user.id === userId())
}

export async function getProfile(): Promise<User | undefined> {
  if (USE_MOCK) return localGetProfile()
  return remote<User>('get', '/patient/profile')
}

export async function updateProfile(patch: Partial<User>): Promise<User> {
  if (!USE_MOCK) return remote<User>('put', '/patient/profile', patch)
  // MOCK: stands in for PUT /patient/profile
  const users = getUsers()
  const user = users.find((item) => item.id === userId())
  if (!user) throw new ApiError('NOT_FOUND', 'Profile not found', 404)
  Object.assign(user, patch)
  saveList('users', users)
  const token = currentUser()
  if (token) localStorage.setItem('auth_token', JSON.stringify({ ...token, name: user.name, email: user.email }))
  return user
}

/* ------------------------------ family members ------------------------------ */

function familyAll(): FamilyMember[] {
  return loadList<FamilyMember>('family_members', () => mockFamilyMembers)
}

// MOCK: stands in for GET /patient/family-members
function localGetFamily(): FamilyMember[] {
  return familyAll().filter((member) => member.userId === userId())
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  if (USE_MOCK) return localGetFamily()
  return remote<FamilyMember[]>('get', '/patient/family-members')
}

export async function createFamilyMember(input: Omit<FamilyMember, 'id' | 'userId'>): Promise<FamilyMember> {
  if (!USE_MOCK) return remote<FamilyMember>('post', '/patient/family-members', input)
  // MOCK: stands in for POST /patient/family-members
  const member: FamilyMember = { ...input, id: newId('fm'), userId: userId() }
  saveList('family_members', [member, ...familyAll()])
  return member
}

export async function updateFamilyMember(id: string, input: Omit<FamilyMember, 'id' | 'userId'>): Promise<FamilyMember> {
  if (!USE_MOCK) return remote<FamilyMember>('put', `/patient/family-members/${id}`, input)
  // MOCK: stands in for PUT /patient/family-members/:id
  const all = familyAll()
  const member = all.find((item) => item.id === id)
  if (!member) throw new ApiError('NOT_FOUND', 'Family member not found', 404)
  Object.assign(member, input)
  saveList('family_members', all)
  return member
}

export async function deleteFamilyMember(id: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('delete', `/patient/family-members/${id}`)
    return
  }
  // MOCK: stands in for DELETE /patient/family-members/:id
  saveList('family_members', familyAll().filter((item) => item.id !== id))
}

/* ------------------------------ holds + booking ------------------------------ */

export interface HoldInput {
  doctorId: string
  clinicId: string
  mode: Mode
  date: string
  startTime: string
}

// MOCK: stands in for POST /appointments/hold (409 when the slot is gone)
function localHoldSlot(input: HoldInput): Hold {
  const slots = buildSlotsForDate(input.date, slotContext(input.doctorId, input.mode, input.clinicId))
  const slot = slots.find((item) => item.startTime === input.startTime)
  if (!slot || !slot.available) {
    throw new ApiError('SLOT_TAKEN', 'That slot was just taken. Please pick another time.', 409)
  }
  const minutes = localSettings().holdMinutes
  const hold: Hold = {
    ...input,
    holdId: newId('hold'),
    expiresAt: new Date(Date.now() + minutes * 60000).toISOString(),
    userId: userId(),
  }
  saveList('holds', [...holdsAll().filter((item) => item.userId !== userId()), hold])
  return hold
}

export async function holdSlot(input: HoldInput): Promise<Hold> {
  if (USE_MOCK) return localHoldSlot(input)
  const data = await remote<{ holdId: string; expiresAt: string }>('post', '/appointments/hold', input)
  return { ...input, ...data, userId: userId() }
}

export async function releaseHold(holdId: string): Promise<void> {
  if (!USE_MOCK) return
  // MOCK: real backend expires holds server-side
  saveList('holds', holdsAll().filter((item) => item.holdId !== holdId))
}

export interface CreateAppointmentInput {
  holdId: string
  patientMemberId: string
  reason: string
  payAtClinic: boolean
}

// MOCK: stands in for POST /appointments
function localCreateAppointment(input: CreateAppointmentInput): Appointment {
  const hold = loadList<Hold>('holds', () => []).find((item) => item.holdId === input.holdId)
  if (!hold || new Date(hold.expiresAt).getTime() <= Date.now()) {
    throw new ApiError('HOLD_EXPIRED', 'Your slot hold has expired. Please select a slot again.', 410)
  }
  const doctor = localGetDoctor(hold.doctorId)
  if (!doctor) throw new ApiError('NOT_FOUND', 'Doctor not found', 404)
  const user = localGetProfile()!
  const member = familyAll().find((item) => item.id === input.patientMemberId)
  const clinic = doctor.clinics.find((item) => item.id === hold.clinicId) ?? doctor.clinics[0]
  const slot = buildSlotsForDate(hold.date, slotContext(hold.doctorId, hold.mode, hold.clinicId, hold.holdId)).find(
    (item) => item.startTime === hold.startTime,
  )
  if (!slot || !slot.available) throw new ApiError('SLOT_TAKEN', 'That slot was just taken.', 409)
  const all = appointmentsAll()
  const now = new Date().toISOString()
  const confirmedNow = input.payAtClinic && hold.mode === 'CLINIC'
  const appointment: Appointment = {
    id: newId('a'),
    referenceNo: `MB${Date.now().toString().slice(-7)}`,
    doctorId: doctor.id,
    doctor: { id: doctor.id, name: doctor.name, photoUrl: doctor.photoUrl, specialties: doctor.specialties },
    patientUserId: user.id,
    patient: { memberId: member?.id ?? 'self', name: member?.name ?? user.name, relation: member?.relation ?? 'Self' },
    patientInfo: {
      age: member ? new Date().getFullYear() - Number(member.dateOfBirth.slice(0, 4)) : 30,
      gender: member?.gender ?? 'Not specified',
      allergies: 'None reported',
      conditions: 'None reported',
    },
    clinic: { id: clinic?.id ?? '', name: clinic?.name ?? 'Video consultation', address: clinic?.address ?? 'Online' },
    mode: hold.mode,
    date: hold.date,
    startTime: hold.startTime,
    endTime: slot.endTime,
    reason: input.reason,
    status: confirmedNow ? 'CONFIRMED' : 'PENDING_PAYMENT',
    fee: hold.mode === 'VIDEO' ? doctor.consultationFees.video : doctor.consultationFees.clinic,
    paymentStatus: 'PENDING',
    payAtClinic: confirmedNow,
    videoLinkAvailable: false,
    canReschedule: true,
    canCancel: true,
    history: [
      { action: 'Appointment booked', actor: user.name, timestamp: now },
      ...(confirmedNow ? [{ action: 'Appointment confirmed (pay at clinic)', actor: 'System', timestamp: now }] : []),
    ],
    notes: '',
    reviewed: false,
    holdExpiresAt: confirmedNow ? undefined : hold.expiresAt,
    createdAt: now,
  }
  appointment.videoLinkAvailable = appointment.mode === 'VIDEO' && appointment.status === 'CONFIRMED'
  saveList('appointments', [appointment, ...all])
  saveList('holds', holdsAll().filter((item) => item.holdId !== hold.holdId))
  pushNotification(user.id, 'APPOINTMENT', `Appointment ${appointment.referenceNo} with ${doctor.name} created.`)
  pushNotification(`u-${doctor.id.replace('d', 'doc')}`, 'APPOINTMENT', `New appointment from ${appointment.patient.name}.`)
  return appointment
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  if (USE_MOCK) return localCreateAppointment(input)
  return remote<Appointment>('post', '/appointments', input)
}

export async function initiatePayment(appointmentId: string) {
  if (USE_MOCK) {
    // MOCK: stands in for POST /payments/:appointmentId/initiate
    const appointment = appointmentsAll().find((item) => item.id === appointmentId)
    if (!appointment) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
    return { gatewayOrderId: newId('order'), amount: appointment.fee, redirectUrl: '' }
  }
  return remote<{ gatewayOrderId: string; amount: number; redirectUrl: string }>('post', `/payments/${appointmentId}/initiate`)
}

export async function confirmPayment(appointmentId: string, status: 'SUCCESS' | 'FAILED'): Promise<Appointment> {
  if (!USE_MOCK) {
    return remote<Appointment>('post', `/payments/${appointmentId}/confirm`, { gatewayReference: newId('ref'), status })
  }
  // MOCK: stands in for POST /payments/:appointmentId/confirm (mock gateway)
  const existing = appointmentsAll().find((item) => item.id === appointmentId)
  if (!existing) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
  if (existing.holdExpiresAt && new Date(existing.holdExpiresAt).getTime() < Date.now()) {
    patchAppointment(appointmentId, (item) => {
      item.status = 'EXPIRED'
    })
    throw new ApiError('HOLD_EXPIRED', 'Your slot hold expired before payment completed.', 410)
  }
  const now = new Date().toISOString()
  const updated = patchAppointment(appointmentId, (item) => {
    if (status === 'SUCCESS') {
      item.paymentStatus = 'PAID'
      item.status = 'CONFIRMED'
      item.history.push({ action: 'Payment received', actor: 'Payment gateway', timestamp: now })
      item.history.push({ action: 'Appointment confirmed', actor: 'System', timestamp: now })
    } else {
      item.paymentStatus = 'FAILED'
      item.history.push({ action: 'Payment failed', actor: 'Payment gateway', timestamp: now })
    }
  })
  const payments = loadList<Payment>('payments', buildMockPayments)
  const settings = localSettings()
  payments.unshift({
    id: newId('pay'),
    userId: updated.patientUserId,
    appointmentId: updated.id,
    referenceNo: updated.referenceNo,
    doctorName: updated.doctor.name,
    doctorId: updated.doctorId,
    amount: updated.fee,
    commission: Math.round((updated.fee * settings.commissionPercent) / 100),
    status: status === 'SUCCESS' ? 'PAID' : 'FAILED',
    method: 'Card',
    date: todayISO(),
  })
  saveList('payments', payments)
  if (status === 'SUCCESS') pushNotification(updated.patientUserId, 'PAYMENT', `Payment received for ${updated.referenceNo}.`)
  return updated
}

/* ------------------------------ appointments ------------------------------ */

// MOCK: stands in for GET /appointments/me
function localGetMyAppointments(): Appointment[] {
  return appointmentsAll()
    .filter((appointment) => appointment.patientUserId === userId())
    .sort((first, second) => `${second.date}${second.startTime}`.localeCompare(`${first.date}${first.startTime}`))
}

export async function getMyAppointments(): Promise<Appointment[]> {
  if (USE_MOCK) return localGetMyAppointments()
  const { data } = await remoteList<Appointment[]>('/appointments/me', { pageSize: 100 })
  return data
}

// MOCK: stands in for GET /appointments/:id
function localGetAppointment(id: string): Appointment | undefined {
  return appointmentsAll().find((appointment) => appointment.id === id)
}

export async function getAppointment(id: string): Promise<Appointment | undefined> {
  if (USE_MOCK) return localGetAppointment(id)
  return remote<Appointment>('get', `/appointments/${id}`)
}

export async function rescheduleAppointment(id: string, date: string, startTime: string): Promise<Appointment> {
  if (!USE_MOCK) return remote<Appointment>('post', `/appointments/${id}/reschedule`, { date, startTime })
  // MOCK: stands in for POST /appointments/:id/reschedule
  const existing = localGetAppointment(id)
  if (!existing) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
  const slot = buildSlotsForDate(date, slotContext(existing.doctorId, existing.mode, existing.clinic.id)).find(
    (item) => item.startTime === startTime,
  )
  if (!slot || !slot.available) throw new ApiError('SLOT_TAKEN', 'That slot was just taken. Please pick another time.', 409)
  return patchAppointment(id, (item) => {
    item.history.push({
      action: 'Rescheduled',
      actor: item.patient.name,
      timestamp: new Date().toISOString(),
      note: `From ${item.date} ${item.startTime} to ${date} ${startTime}`,
    })
    item.date = date
    item.startTime = startTime
    item.endTime = slot.endTime
    item.status = item.paymentStatus === 'PAID' || item.payAtClinic ? 'CONFIRMED' : 'PENDING_PAYMENT'
  })
}

export async function getRefundPreview(appointment: Appointment) {
  return computeRefund(appointment, await getSettings())
}

export async function cancelAppointment(id: string, reason: string, byDoctor = false): Promise<Appointment> {
  if (!USE_MOCK) {
    return remote<Appointment>(byDoctor ? 'patch' : 'post', byDoctor ? `/doctor/appointments/${id}/status` : `/appointments/${id}/cancel`, byDoctor ? { status: 'CANCELLED_BY_DOCTOR', reason } : { reason })
  }
  // MOCK: stands in for POST /appointments/:id/cancel (refund per platform settings)
  const existing = localGetAppointment(id)
  if (!existing) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
  const refund = byDoctor ? { amount: existing.fee, percent: 100 } : computeRefund(existing, localSettings())
  const wasPaid = existing.paymentStatus === 'PAID'
  const updated = patchAppointment(id, (item) => {
    item.status = byDoctor ? 'CANCELLED_BY_DOCTOR' : 'CANCELLED_BY_PATIENT'
    if (wasPaid) item.paymentStatus = refund.percent === 100 ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
    item.history.push({
      action: byDoctor ? 'Cancelled by doctor' : 'Cancelled by patient',
      actor: byDoctor ? item.doctor.name : item.patient.name,
      timestamp: new Date().toISOString(),
      note: reason,
    })
  })
  if (wasPaid && refund.amount > 0) {
    const refunds = loadList<Refund>('refunds', () => mockRefunds)
    const payment = loadList<Payment>('payments', buildMockPayments).find((item) => item.appointmentId === id)
    refunds.unshift({
      id: newId('rf'),
      paymentId: payment?.id ?? '',
      appointmentRef: existing.referenceNo,
      amount: refund.amount,
      reason: reason || 'Cancellation',
      status: 'REQUESTED',
    })
    saveList('refunds', refunds)
  }
  pushNotification(updated.patientUserId, 'APPOINTMENT', `Appointment ${updated.referenceNo} was cancelled.`)
  return updated
}

export async function getVideoLink(id: string): Promise<string> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /appointments/:id/video-link
    return `https://meet.jit.si/medibook-${id}`
  }
  const data = await remote<{ url: string }>('get', `/appointments/${id}/video-link`)
  return data.url
}

export async function createReview(appointmentId: string, rating: number, comment: string): Promise<Review> {
  if (!USE_MOCK) return remote<Review>('post', `/appointments/${appointmentId}/review`, { rating, comment })
  // MOCK: stands in for POST /appointments/:id/review (goes to moderation)
  const appointment = localGetAppointment(appointmentId)
  if (!appointment) throw new ApiError('NOT_FOUND', 'Appointment not found', 404)
  const review: Review = {
    id: newId('rv'),
    doctorId: appointment.doctorId,
    doctorName: appointment.doctor.name,
    appointmentId,
    patientName: appointment.patient.name,
    rating,
    comment,
    date: todayISO(),
    reply: '',
    moderation: 'PENDING',
  }
  saveList('reviews', [review, ...loadList<Review>('reviews', () => mockReviews)])
  patchAppointment(appointmentId, (item) => {
    item.reviewed = true
  })
  return review
}

/* ------------------------------ prescriptions ------------------------------ */

export function prescriptionsAll(): Prescription[] {
  return loadList<Prescription>('prescriptions', buildMockPrescriptions)
}

export async function getPrescriptions(): Promise<Prescription[]> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /prescriptions/me
    return prescriptionsAll().filter((item) => item.patientUserId === userId())
  }
  return remote<Prescription[]>('get', '/prescriptions/me')
}

export async function getPrescription(id: string): Promise<Prescription | undefined> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /prescriptions/:id
    return prescriptionsAll().find((item) => item.id === id)
  }
  return remote<Prescription>('get', `/prescriptions/${id}`)
}

/* ------------------------------ medical records ------------------------------ */

function recordsAll(): MedicalRecord[] {
  return loadList<MedicalRecord>('medical_records', () => [])
}

export async function getMedicalRecords(): Promise<MedicalRecord[]> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /medical-records
    return recordsAll().filter((record) => record.userId === userId())
  }
  return remote<MedicalRecord[]>('get', '/medical-records')
}

export async function createMedicalRecord(input: Omit<MedicalRecord, 'id' | 'userId'>): Promise<MedicalRecord> {
  if (!USE_MOCK) return remote<MedicalRecord>('post', '/medical-records', input)
  // MOCK: stands in for POST /medical-records (multipart upload)
  const record: MedicalRecord = { ...input, id: newId('rec'), userId: userId() }
  saveList('medical_records', [record, ...recordsAll()])
  return record
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('delete', `/medical-records/${id}`)
    return
  }
  // MOCK: stands in for DELETE /medical-records/:id
  saveList('medical_records', recordsAll().filter((record) => record.id !== id))
}

/* ------------------------------ payments ------------------------------ */

export function paymentsAll(): Payment[] {
  return loadList<Payment>('payments', buildMockPayments)
}

export async function getPayments(): Promise<Payment[]> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /patient/payments
    return paymentsAll().filter((payment) => payment.userId === userId())
  }
  return remote<Payment[]>('get', '/patient/payments')
}

/* ------------------------------ notifications ------------------------------ */

function notificationsAll(): NotificationItem[] {
  return loadList<NotificationItem>('notifications', buildMockNotifications)
}

export async function getNotifications(): Promise<NotificationItem[]> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /notifications
    return notificationsAll().filter((item) => item.userId === userId())
  }
  return remote<NotificationItem[]>('get', '/notifications')
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('patch', `/notifications/${id}/read`)
    return
  }
  // MOCK: stands in for PATCH /notifications/:id/read
  const all = notificationsAll()
  all.forEach((item) => {
    if (item.id === id) item.read = true
  })
  saveList('notifications', all)
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!USE_MOCK) {
    await remote('patch', '/notifications/read-all')
    return
  }
  // MOCK: stands in for PATCH /notifications/read-all
  const all = notificationsAll()
  all.forEach((item) => {
    if (item.userId === userId()) item.read = true
  })
  saveList('notifications', all)
}

export async function clearNotifications(): Promise<void> {
  if (!USE_MOCK) {
    await remote('delete', '/notifications')
    return
  }
  // MOCK: no clear-all endpoint in the contract; removes the user's notifications locally
  saveList('notifications', notificationsAll().filter((item) => item.userId !== userId()))
}

const DEFAULT_PREFS: NotificationPrefs = {
  types: { reminders: true, promotional: false, reviews: true, prescriptions: true, payments: true },
  channels: { email: true, sms: true, push: false },
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  if (USE_MOCK) {
    // MOCK: stands in for GET /notification-preferences
    return loadObject<NotificationPrefs>(`prefs_${userId()}`, () => DEFAULT_PREFS)
  }
  return remote<NotificationPrefs>('get', '/notification-preferences')
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<NotificationPrefs> {
  if (!USE_MOCK) return remote<NotificationPrefs>('put', '/notification-preferences', prefs)
  // MOCK: stands in for PUT /notification-preferences
  saveObject(`prefs_${userId()}`, prefs)
  return prefs
}

/* ------------------------------ shared internals for other stores ------------------------------ */

export const internals = {
  appointmentsAll,
  doctorsAll,
  localSettings,
  patchAppointment,
  pushNotification,
  slotContext,
}

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'
export type Mode = 'CLINIC' | 'VIDEO'
export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED_BY_PATIENT'
  | 'CANCELLED_BY_DOCTOR'
  | 'NO_SHOW'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'

export interface User {
  id: string
  name: string
  email: string
  mobile: string
  password: string
  role: Role
  status: 'ACTIVE' | 'BLOCKED'
  doctorId?: string
  photoUrl?: string
  language?: string
  privacy?: { shareRecords: boolean; showProfile: boolean }
}

export interface AuthToken {
  token: string
  id: string
  name: string
  email: string
  role: Role
  doctorId?: string
}

export interface Clinic {
  id: string
  name: string
  address: string
  locality: string
  city: string
  lat: number
  lng: number
  photos: string[]
}

export interface Doctor {
  id: string
  name: string
  photoUrl: string
  gender: 'Male' | 'Female'
  specialties: string[]
  qualifications: string[]
  experienceYears: number
  rating: number
  reviewCount: number
  languages: string[]
  clinics: Clinic[]
  consultationFees: { clinic: number; video: number }
  modes: Mode[]
  about: string
  services: string[]
  registrationNo: string
  council: string
  verification: VerificationStatus
  verificationReason?: string
  documents: string[]
  faqs: { q: string; a: string }[]
  payAtClinic: boolean
  manualApproval: boolean
}

export interface NextSlot {
  date: string
  startTime: string
  mode: Mode
}

export interface DoctorListItem extends Doctor {
  nextAvailableSlot: NextSlot | null
}

export interface Slot {
  startTime: string
  endTime: string
  available: boolean
}

export interface SlotDay {
  date: string
  slots: Slot[]
}

export interface TimeRange {
  start: string
  end: string
}

export interface DaySchedule {
  day: number
  enabled: boolean
  ranges: TimeRange[]
  breaks: TimeRange[]
  slotMinutes: number
  buffer: number
  clinicId: string
  mode: Mode | 'BOTH'
}

export interface Leave {
  id: string
  fromDate: string
  toDate: string
  reason: string
}

export interface Override {
  id: string
  date: string
  ranges: TimeRange[]
  closed: boolean
}

export interface Availability {
  doctorId: string
  weekly: DaySchedule[]
  leaves: Leave[]
  overrides: Override[]
}

export interface HistoryEntry {
  action: string
  actor: string
  timestamp: string
  note?: string
}

export interface Appointment {
  id: string
  referenceNo: string
  doctorId: string
  doctor: { id: string; name: string; photoUrl: string; specialties: string[] }
  patientUserId: string
  patient: { memberId: string; name: string; relation: string }
  patientInfo: { age: number; gender: string; allergies: string; conditions: string }
  clinic: { id: string; name: string; address: string }
  mode: Mode
  date: string
  startTime: string
  endTime: string
  reason: string
  status: AppointmentStatus
  fee: number
  paymentStatus: PaymentStatus
  payAtClinic: boolean
  videoLinkAvailable: boolean
  canReschedule: boolean
  canCancel: boolean
  history: HistoryEntry[]
  notes: string
  reviewed: boolean
  prescriptionId?: string
  followUpEligible?: boolean
  holdExpiresAt?: string
  createdAt: string
}

export interface FamilyMember {
  id: string
  userId: string
  name: string
  relation: string
  dateOfBirth: string
  gender: string
}

export interface Hold {
  holdId: string
  doctorId: string
  clinicId: string
  mode: Mode
  date: string
  startTime: string
  expiresAt: string
  userId: string
}

export interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface Prescription {
  id: string
  appointmentId: string
  patientUserId: string
  patientName: string
  doctorId: string
  doctorName: string
  appointmentDate: string
  issuedAt: string
  diagnosis: string
  medicines: Medicine[]
  tests: string[]
  advice: string
  followUpDate: string
}

export interface MedicalRecord {
  id: string
  userId: string
  fileName: string
  fileType: string
  size: number
  recordType: string
  date: string
  dataUrl: string
}

export interface Payment {
  id: string
  userId: string
  appointmentId: string
  referenceNo: string
  doctorName: string
  doctorId: string
  amount: number
  commission: number
  status: PaymentStatus
  method: string
  date: string
}

export interface NotificationItem {
  id: string
  userId: string
  type: 'APPOINTMENT' | 'REMINDER' | 'REVIEW' | 'PRESCRIPTION' | 'PAYMENT' | 'PROMOTIONAL'
  message: string
  createdAt: string
  read: boolean
}

export interface NotificationPrefs {
  types: Record<string, boolean>
  channels: { email: boolean; sms: boolean; push: boolean }
}

export interface Review {
  id: string
  doctorId: string
  doctorName: string
  appointmentId: string
  patientName: string
  rating: number
  comment: string
  date: string
  reply: string
  moderation: 'APPROVED' | 'PENDING' | 'REJECTED'
}

export interface MasterItem {
  id: string
  name: string
  extra?: string
}

export type MasterType = 'specialties' | 'symptoms' | 'cities'

export interface Refund {
  id: string
  paymentId: string
  appointmentRef: string
  amount: number
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED'
}

export interface PlatformSettings {
  commissionPercent: number
  cancellationWindowHours: number
  refundPercent: number
  holdMinutes: number
  leadTimeHours: number
}

export interface SearchParams {
  q?: string
  city?: string
  locality?: string
  specialty?: string
  mode?: string
  feeMin?: number
  feeMax?: number
  experienceMin?: number
  gender?: string
  language?: string
  availability?: string
  ratingMin?: number
  radiusKm?: number
  sort?: string
  page?: number
  pageSize?: number
}

export interface SearchResult {
  items: DoctorListItem[]
  total: number
  facets: {
    specialty: Record<string, number>
    mode: Record<string, number>
    gender: Record<string, number>
    language: Record<string, number>
  }
}

export interface ApiErrorShape {
  code: string
  message: string
  details?: { field: string; message: string }[]
}

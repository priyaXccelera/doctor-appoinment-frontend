// MOCK DATA — placeholder records for local development only.
// Replace with real API data before production use.
import type {
  Appointment,
  Availability,
  AppointmentStatus,
  Clinic,
  Doctor,
  FamilyMember,
  MasterItem,
  Mode,
  NotificationItem,
  PaymentStatus,
  Payment,
  PlatformSettings,
  Prescription,
  Refund,
  Review,
  User,
} from '../types'
import { addDaysISO, todayISO } from '../utils/format'

export const DEMO_PASSWORD = 'Clinic@123'

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=ffffff&size=200`

export const mockSpecialties: MasterItem[] = [
  'General Physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatrician',
  'Dentist',
  'Orthopedic',
  'Cardiologist',
  'ENT Specialist',
  'Psychiatrist',
  'Neurologist',
  'Ophthalmologist',
  'Gastroenterologist',
].map((name, index) => ({ id: `sp${index + 1}`, name }))

export const mockSymptoms: MasterItem[] = [
  ['Fever', 'General Physician'],
  ['Acne', 'Dermatologist'],
  ['Toothache', 'Dentist'],
  ['Chest pain', 'Cardiologist'],
  ['Back pain', 'Orthopedic'],
  ['Cough and cold', 'General Physician'],
  ['Period problems', 'Gynecologist'],
  ['Child not eating', 'Pediatrician'],
  ['Anxiety', 'Psychiatrist'],
  ['Migraine', 'Neurologist'],
  ['Blurred vision', 'Ophthalmologist'],
  ['Stomach pain', 'Gastroenterologist'],
].map(([name, extra], index) => ({ id: `sy${index + 1}`, name, extra }))

export const mockCities: MasterItem[] = [
  ['Bengaluru', '12.9716,77.5946'],
  ['Mumbai', '19.0760,72.8777'],
  ['Delhi', '28.6139,77.2090'],
  ['Hyderabad', '17.3850,78.4867'],
  ['Chennai', '13.0827,80.2707'],
  ['Pune', '18.5204,73.8567'],
].map(([name, extra], index) => ({ id: `ct${index + 1}`, name, extra }))

const clinicSeeds: [string, string, string, string, number, number][] = [
  ['HealWell Clinic', 'Koramangala', 'Bengaluru', '12, 5th Block, Koramangala', 12.9352, 77.6245],
  ['CareFirst Polyclinic', 'Indiranagar', 'Bengaluru', '100 Feet Road, Indiranagar', 12.9784, 77.6408],
  ['Sunrise Health Centre', 'Andheri West', 'Mumbai', '21, Link Road, Andheri West', 19.1364, 72.8296],
  ['LifeLine Clinic', 'Bandra', 'Mumbai', '7, Hill Road, Bandra West', 19.0596, 72.8295],
  ['Metro Medicare', 'Connaught Place', 'Delhi', 'N-Block, Connaught Place', 28.6315, 77.2167],
  ['Green Cross Clinic', 'Banjara Hills', 'Hyderabad', 'Road No. 12, Banjara Hills', 17.4126, 78.4482],
  ['Apex Care', 'T. Nagar', 'Chennai', '45, Usman Road, T. Nagar', 13.0418, 80.2341],
  ['Wellness Hub', 'Kothrud', 'Pune', '3, Karve Road, Kothrud', 18.5074, 73.8077],
]

export const mockClinics: Clinic[] = clinicSeeds.map(([name, locality, city, address, lat, lng], index) => ({
  id: `c${index + 1}`,
  name,
  address: `${address}, ${city}`,
  locality,
  city,
  lat,
  lng,
  photos: [`https://picsum.photos/seed/clinic${index}a/320/200`, `https://picsum.photos/seed/clinic${index}b/320/200`],
}))

const doctorSeeds: [string, 'Male' | 'Female', string[], string[], number, number, number, string[], number[], number, number][] = [
  ['Dr. Ananya Rao', 'Female', ['General Physician'], ['MBBS', 'MD Internal Medicine'], 12, 4.8, 214, ['English', 'Hindi', 'Kannada'], [0, 1], 500, 400],
  ['Dr. Rahul Mehta', 'Male', ['Cardiologist'], ['MBBS', 'DM Cardiology'], 18, 4.9, 342, ['English', 'Hindi', 'Gujarati'], [2, 3], 900, 700],
  ['Dr. Sneha Iyer', 'Female', ['Dermatologist'], ['MBBS', 'MD Dermatology'], 9, 4.6, 156, ['English', 'Tamil', 'Hindi'], [6], 700, 500],
  ['Dr. Vikram Singh', 'Male', ['Orthopedic'], ['MBBS', 'MS Orthopedics'], 15, 4.5, 198, ['English', 'Hindi', 'Punjabi'], [4], 800, 600],
  ['Dr. Priya Nair', 'Female', ['Pediatrician'], ['MBBS', 'DCH'], 11, 4.9, 410, ['English', 'Malayalam', 'Hindi'], [1], 600, 450],
  ['Dr. Arjun Reddy', 'Male', ['Dentist'], ['BDS', 'MDS'], 8, 4.4, 120, ['English', 'Telugu', 'Hindi'], [5], 400, 300],
  ['Dr. Kavita Joshi', 'Female', ['Gynecologist'], ['MBBS', 'MS Obstetrics & Gynecology'], 20, 4.7, 289, ['English', 'Marathi', 'Hindi'], [7], 850, 650],
  ['Dr. Sameer Khan', 'Male', ['ENT Specialist'], ['MBBS', 'MS ENT'], 14, 4.3, 98, ['English', 'Hindi', 'Urdu'], [4], 600, 450],
  ['Dr. Meera Pillai', 'Female', ['Psychiatrist'], ['MBBS', 'MD Psychiatry'], 10, 4.8, 175, ['English', 'Malayalam', 'Tamil'], [6], 1000, 800],
  ['Dr. Karan Malhotra', 'Male', ['Neurologist'], ['MBBS', 'DM Neurology'], 16, 4.6, 133, ['English', 'Hindi'], [0], 1200, 900],
  ['Dr. Divya Menon', 'Female', ['Ophthalmologist'], ['MBBS', 'MS Ophthalmology'], 7, 4.2, 76, ['English', 'Kannada', 'Hindi'], [1], 500, 350],
  ['Dr. Rohit Verma', 'Male', ['Gastroenterologist', 'General Physician'], ['MBBS', 'DM Gastroenterology'], 13, 4.5, 143, ['English', 'Hindi', 'Telugu'], [5], 900, 700],
]

export const mockDoctors: Doctor[] = doctorSeeds.map(
  ([name, gender, specialties, qualifications, experienceYears, rating, reviewCount, languages, clinicIdx, clinicFee, videoFee], index) => ({
    id: `d${index + 1}`,
    name,
    photoUrl: avatar(name),
    gender,
    specialties,
    qualifications,
    experienceYears,
    rating,
    reviewCount,
    languages,
    clinics: clinicIdx.map((position) => mockClinics[position]),
    consultationFees: { clinic: clinicFee, video: videoFee },
    modes: ['CLINIC', 'VIDEO'] as Mode[],
    about: `${name} is a ${specialties[0].toLowerCase()} with ${experienceYears} years of experience, known for a patient-first approach, clear explanations and evidence-based treatment.`,
    services: [`${specialties[0]} consultation`, 'Follow-up care', 'Preventive health check', 'Second opinion'],
    registrationNo: `MCI-${40000 + index * 137}`,
    council: 'National Medical Commission',
    verification: index === 10 ? 'PENDING' : index === 11 ? 'REJECTED' : 'VERIFIED',
    verificationReason: index === 11 ? 'Registration certificate image is unreadable. Please re-upload.' : undefined,
    documents: ['registration-certificate.pdf', 'degree-certificate.pdf'],
    faqs: [
      { q: 'How do I prepare for the visit?', a: 'Carry previous reports and a list of current medicines.' },
      { q: 'Can I reschedule?', a: 'Yes, you can reschedule from My Appointments up to the cancellation window.' },
      { q: 'Is a follow-up free?', a: 'A follow-up within 7 days of the visit is free or discounted.' },
    ],
    payAtClinic: index % 3 !== 2,
    manualApproval: index === 1,
  }),
)

export const mockUsers: User[] = [
  { id: 'u-admin', name: 'Platform Admin', email: 'admin@clinic.com', mobile: '9000000000', password: DEMO_PASSWORD, role: 'ADMIN', status: 'ACTIVE' },
  ...[1, 2, 3, 4, 5].map((number): User => ({
    id: `u-doc${number}`,
    name: mockDoctors[number - 1].name,
    email: `doctor${number}@clinic.com`,
    mobile: `98000000${number}0`,
    password: DEMO_PASSWORD,
    role: 'DOCTOR',
    status: 'ACTIVE',
    doctorId: `d${number}`,
    photoUrl: mockDoctors[number - 1].photoUrl,
  })),
  ...['Aarav Sharma', 'Diya Patel', 'Rohan Gupta', 'Isha Kapoor', 'Kabir Das'].map((name, index): User => ({
    id: `u-pat${index + 1}`,
    name,
    email: `patient${index + 1}@mail.com`,
    mobile: `97000000${index + 1}0`,
    password: DEMO_PASSWORD,
    role: 'PATIENT',
    status: index === 4 ? 'BLOCKED' : 'ACTIVE',
    photoUrl: avatar(name),
    language: 'English',
    privacy: { shareRecords: true, showProfile: false },
  })),
]

export const mockFamilyMembers: FamilyMember[] = [
  { id: 'fm1', userId: 'u-pat1', name: 'Meera Sharma', relation: 'Mother', dateOfBirth: '1968-04-12', gender: 'Female' },
  { id: 'fm2', userId: 'u-pat1', name: 'Anika Sharma', relation: 'Daughter', dateOfBirth: '2018-09-03', gender: 'Female' },
  { id: 'fm3', userId: 'u-pat2', name: 'Nirav Patel', relation: 'Spouse', dateOfBirth: '1990-01-20', gender: 'Male' },
]

export const mockSettings: PlatformSettings = {
  commissionPercent: 12,
  cancellationWindowHours: 24,
  refundPercent: 50,
  holdMinutes: 5,
  leadTimeHours: 1,
}

export function defaultAvailability(doctorId: string): Availability {
  const doctor = mockDoctors.find((item) => item.id === doctorId)
  const clinicId = doctor?.clinics[0]?.id ?? 'c1'
  return {
    doctorId,
    weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      enabled: day !== 0,
      ranges: [
        { start: '09:00', end: '13:00' },
        { start: '16:00', end: '19:00' },
      ],
      breaks: [{ start: '11:00', end: '11:30' }],
      slotMinutes: 30,
      buffer: 0,
      clinicId,
      mode: 'BOTH',
    })),
    leaves: [],
    overrides: [],
  }
}

interface ApptSeed {
  doctor: number
  patient: number
  member?: string
  dayOffset: number
  start: string
  mode: Mode
  status: AppointmentStatus
  pay: PaymentStatus
  reason: string
}

const apptSeeds: ApptSeed[] = [
  { doctor: 1, patient: 1, dayOffset: 0, start: '17:00', mode: 'VIDEO', status: 'CONFIRMED', pay: 'PAID', reason: 'Recurring fever and body ache' },
  { doctor: 1, patient: 2, dayOffset: 0, start: '16:00', mode: 'CLINIC', status: 'CONFIRMED', pay: 'PENDING', reason: 'Seasonal allergies' },
  { doctor: 1, patient: 3, dayOffset: 0, start: '09:30', mode: 'CLINIC', status: 'COMPLETED', pay: 'PAID', reason: 'Routine check-up' },
  { doctor: 2, patient: 1, member: 'fm1', dayOffset: 3, start: '10:00', mode: 'CLINIC', status: 'CONFIRMED', pay: 'PAID', reason: 'Chest discomfort while climbing stairs' },
  { doctor: 3, patient: 1, dayOffset: 5, start: '10:30', mode: 'VIDEO', status: 'PENDING_PAYMENT', pay: 'PENDING', reason: 'Skin rash on arms' },
  { doctor: 1, patient: 1, dayOffset: -10, start: '09:00', mode: 'CLINIC', status: 'COMPLETED', pay: 'PAID', reason: 'Persistent cough' },
  { doctor: 5, patient: 1, member: 'fm2', dayOffset: -20, start: '10:00', mode: 'CLINIC', status: 'COMPLETED', pay: 'PAID', reason: 'Child vaccination advice' },
  { doctor: 4, patient: 1, dayOffset: -6, start: '18:00', mode: 'CLINIC', status: 'CANCELLED_BY_PATIENT', pay: 'REFUNDED', reason: 'Knee pain' },
  { doctor: 1, patient: 4, dayOffset: 2, start: '09:00', mode: 'VIDEO', status: 'CONFIRMED', pay: 'PAID', reason: 'Follow-up on blood test results' },
  { doctor: 1, patient: 5, dayOffset: -3, start: '16:30', mode: 'CLINIC', status: 'NO_SHOW', pay: 'PAID', reason: 'Headache' },
  { doctor: 1, patient: 2, dayOffset: 1, start: '12:00', mode: 'CLINIC', status: 'PENDING_PAYMENT', pay: 'PENDING', reason: 'Fatigue' },
  { doctor: 2, patient: 2, dayOffset: -8, start: '11:00', mode: 'CLINIC', status: 'COMPLETED', pay: 'PAID', reason: 'ECG review' },
]

function addMinutes(time: string, minutes: number): string {
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function canChange(status: AppointmentStatus): boolean {
  return status === 'CONFIRMED' || status === 'PENDING_PAYMENT' || status === 'RESCHEDULED'
}

export function buildMockAppointments(): Appointment[] {
  const today = todayISO()
  return apptSeeds.map((seed, index) => {
    const doctor = mockDoctors[seed.doctor - 1]
    const user = mockUsers.find((item) => item.id === `u-pat${seed.patient}`)!
    const member = mockFamilyMembers.find((item) => item.id === seed.member)
    const clinic = doctor.clinics[0]
    const date = addDaysISO(today, seed.dayOffset)
    const created = new Date(Date.now() - 86400000 * (Math.abs(seed.dayOffset) + 2)).toISOString()
    return {
      id: `a${index + 1}`,
      referenceNo: `MB${2026000 + index + 101}`,
      doctorId: doctor.id,
      doctor: { id: doctor.id, name: doctor.name, photoUrl: doctor.photoUrl, specialties: doctor.specialties },
      patientUserId: user.id,
      patient: { memberId: member?.id ?? 'self', name: member?.name ?? user.name, relation: member?.relation ?? 'Self' },
      patientInfo: {
        age: member ? 40 : 29 + seed.patient,
        gender: member?.gender ?? (seed.patient % 2 ? 'Male' : 'Female'),
        allergies: seed.patient === 2 ? 'Penicillin' : 'None reported',
        conditions: seed.patient === 3 ? 'Type 2 diabetes' : 'None reported',
      },
      clinic: { id: clinic.id, name: clinic.name, address: clinic.address },
      mode: seed.mode,
      date,
      startTime: seed.start,
      endTime: addMinutes(seed.start, 30),
      reason: seed.reason,
      status: seed.status,
      fee: seed.mode === 'VIDEO' ? doctor.consultationFees.video : doctor.consultationFees.clinic,
      paymentStatus: seed.pay,
      payAtClinic: seed.pay === 'PENDING' && seed.status === 'CONFIRMED',
      videoLinkAvailable: seed.mode === 'VIDEO' && seed.status === 'CONFIRMED',
      canReschedule: canChange(seed.status),
      canCancel: canChange(seed.status),
      history: [
        { action: 'Appointment booked', actor: user.name, timestamp: created },
        ...(seed.status === 'CONFIRMED' || seed.status === 'COMPLETED'
          ? [{ action: 'Appointment confirmed', actor: 'System', timestamp: created }]
          : []),
        ...(seed.status === 'CANCELLED_BY_PATIENT'
          ? [{ action: 'Cancelled by patient', actor: user.name, timestamp: created, note: 'Change of plans' }]
          : []),
        ...(seed.status === 'COMPLETED'
          ? [{ action: 'Consultation completed', actor: doctor.name, timestamp: new Date(date).toISOString() }]
          : []),
      ],
      notes: seed.status === 'COMPLETED' ? 'Patient advised rest and hydration. Review if symptoms persist.' : '',
      reviewed: index === 5,
      prescriptionId: seed.status === 'COMPLETED' && index !== 2 ? `rx${index + 1}` : undefined,
      followUpEligible: seed.status === 'COMPLETED',
      createdAt: created,
    }
  })
}

export function buildMockPrescriptions(): Prescription[] {
  return buildMockAppointments()
    .filter((appointment) => appointment.prescriptionId)
    .map((appointment) => ({
      id: appointment.prescriptionId!,
      appointmentId: appointment.id,
      patientUserId: appointment.patientUserId,
      patientName: appointment.patient.name,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor.name,
      appointmentDate: appointment.date,
      issuedAt: new Date(appointment.date).toISOString(),
      diagnosis: 'Viral upper respiratory infection',
      medicines: [
        { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Thrice a day', duration: '3 days', instructions: 'After food' },
        { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once at night', duration: '5 days', instructions: 'May cause drowsiness' },
      ],
      tests: ['Complete blood count'],
      advice: 'Drink plenty of fluids, rest well and avoid cold beverages.',
      followUpDate: addDaysISO(appointment.date, 7),
    }))
}

export function buildMockPayments(): Payment[] {
  return buildMockAppointments()
    .filter((appointment) => appointment.paymentStatus !== 'PENDING')
    .map((appointment, index) => ({
      id: `pay${index + 1}`,
      userId: appointment.patientUserId,
      appointmentId: appointment.id,
      referenceNo: appointment.referenceNo,
      doctorName: appointment.doctor.name,
      doctorId: appointment.doctorId,
      amount: appointment.fee,
      commission: Math.round(appointment.fee * 0.12),
      status: appointment.paymentStatus,
      method: index % 2 ? 'UPI' : 'Card',
      date: appointment.date,
    }))
}

export const mockReviews: Review[] = [
  ['d1', 1, 5, 'Very patient and explained everything clearly. Highly recommended!', 'Thank you for the kind words.', 'APPROVED'],
  ['d1', 3, 4, 'Good consultation, but the waiting time was a bit long.', '', 'APPROVED'],
  ['d1', 2, 5, 'Excellent doctor, accurate diagnosis.', '', 'PENDING'],
  ['d2', 2, 5, 'Detailed cardiac evaluation, felt reassured.', 'Glad I could help.', 'APPROVED'],
  ['d2', 4, 4, 'Knowledgeable and calm.', '', 'APPROVED'],
  ['d3', 1, 3, 'Treatment worked but the clinic was crowded.', '', 'APPROVED'],
  ['d5', 1, 5, 'Wonderful with kids. My daughter was comfortable.', '', 'APPROVED'],
  ['d4', 5, 2, 'Rude behaviour at the reception.', '', 'PENDING'],
].map(([doctorId, patient, rating, comment, reply, moderation], index) => {
  const doctor = mockDoctors.find((item) => item.id === doctorId)!
  return {
    id: `rv${index + 1}`,
    doctorId: doctorId as string,
    doctorName: doctor.name,
    appointmentId: `a${index + 1}`,
    patientName: mockUsers.find((item) => item.id === `u-pat${patient}`)!.name,
    rating: rating as number,
    comment: comment as string,
    date: addDaysISO(todayISO(), -(index * 4 + 2)),
    reply: reply as string,
    moderation: moderation as Review['moderation'],
  }
})

export const mockRefunds: Refund[] = [
  { id: 'rf1', paymentId: 'pay8', appointmentRef: 'MB2026108', amount: 400, reason: 'Cancelled by patient within window', status: 'REQUESTED' },
  { id: 'rf2', paymentId: 'pay3', appointmentRef: 'MB2026103', amount: 250, reason: 'Doctor unavailable, partial dispute', status: 'APPROVED' },
  { id: 'rf3', paymentId: 'pay5', appointmentRef: 'MB2026106', amount: 500, reason: 'Duplicate charge', status: 'PROCESSED' },
]

export function buildMockNotifications(): NotificationItem[] {
  const now = Date.now()
  const base: Omit<NotificationItem, 'id' | 'userId'>[] = [
    { type: 'APPOINTMENT', message: 'Your appointment is confirmed.', createdAt: new Date(now - 3600000).toISOString(), read: false },
    { type: 'REMINDER', message: 'Reminder: you have an appointment today.', createdAt: new Date(now - 7200000).toISOString(), read: false },
    { type: 'PRESCRIPTION', message: 'A new prescription has been issued.', createdAt: new Date(now - 86400000).toISOString(), read: true },
    { type: 'PAYMENT', message: 'Payment received successfully.', createdAt: new Date(now - 172800000).toISOString(), read: true },
    { type: 'PROMOTIONAL', message: 'Free health check-up camp this weekend.', createdAt: new Date(now - 259200000).toISOString(), read: true },
  ]
  return mockUsers.flatMap((user) =>
    base.map((item, index) => ({ ...item, id: `n-${user.id}-${index}`, userId: user.id })),
  )
}

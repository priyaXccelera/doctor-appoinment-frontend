import type { Hold } from '../types'

const DRAFT_KEY = 'booking_draft'

export interface BookingDraft {
  hold: Hold
  patientMemberId: string
  reason: string
  payAtClinic: boolean
  appointmentId?: string
}

export function getDraft(): BookingDraft | null {
  const raw = sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as BookingDraft
  } catch {
    return null
  }
}

export function saveDraft(draft: BookingDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY)
}

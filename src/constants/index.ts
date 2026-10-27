export const PAGE_SIZE = 6
export const THEME_KEY = 'theme'
export const AUTH_KEY = 'auth_token'
export const JOIN_VIDEO_WINDOW_MINUTES = 15
export const DEMO_PASSWORD_HINT = 'Clinic@123'

export const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending payment',
  CONFIRMED: 'Confirmed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED_BY_PATIENT: 'Cancelled',
  CANCELLED_BY_DOCTOR: 'Cancelled by doctor',
  NO_SHOW: 'No show',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
  APPROVED: 'Approved',
  PROCESSED: 'Processed',
  REQUESTED: 'Requested',
}

export const STATUS_TONES: Record<string, string> = {
  CONFIRMED: 'bg-success-soft text-success',
  PAID: 'bg-success-soft text-success',
  VERIFIED: 'bg-success-soft text-success',
  ACTIVE: 'bg-success-soft text-success',
  APPROVED: 'bg-success-soft text-success',
  PROCESSED: 'bg-success-soft text-success',
  PENDING_PAYMENT: 'bg-warn-soft text-warn',
  PENDING: 'bg-warn-soft text-warn',
  REQUESTED: 'bg-warn-soft text-warn',
  RESCHEDULED: 'bg-info-soft text-info',
  COMPLETED: 'bg-info-soft text-info',
  REFUNDED: 'bg-info-soft text-info',
  PARTIALLY_REFUNDED: 'bg-info-soft text-info',
  CANCELLED_BY_PATIENT: 'bg-danger-soft text-danger',
  CANCELLED_BY_DOCTOR: 'bg-danger-soft text-danger',
  FAILED: 'bg-danger-soft text-danger',
  REJECTED: 'bg-danger-soft text-danger',
  SUSPENDED: 'bg-danger-soft text-danger',
  BLOCKED: 'bg-danger-soft text-danger',
  NO_SHOW: 'bg-neutral-soft text-neutral',
  EXPIRED: 'bg-neutral-soft text-neutral',
  IN_PROGRESS: 'bg-violet-soft text-violet',
}

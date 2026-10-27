export function validateRequired(value: string, label = 'This field'): string {
  return value.trim() ? '' : `${label} is required`
}

export function validateEmail(value: string): string {
  if (!value.trim()) return 'Email is required'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address'
}

export function validateMobile(value: string): string {
  if (!value.trim()) return 'Mobile number is required'
  return /^[6-9]\d{9}$/.test(value.trim()) ? '' : 'Enter a valid 10-digit Indian mobile number'
}

export function validatePassword(value: string): string {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(value)) return 'Password must include a number'
  return ''
}

export interface MedicineInput {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface PrescriptionInput {
  diagnosis: string
  medicines: MedicineInput[]
  tests: string
  advice: string
  followUpDate: string
}

export function validatePrescription(input: PrescriptionInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!input.diagnosis.trim()) errors.diagnosis = 'Diagnosis is required'
  if (input.medicines.length === 0) errors.medicines = 'Add at least one medicine'
  input.medicines.forEach((medicine, index) => {
    if (!medicine.name.trim()) errors[`medicine-${index}-name`] = 'Medicine name is required'
    if (!medicine.dosage.trim()) errors[`medicine-${index}-dosage`] = 'Dosage is required'
    if (!medicine.frequency.trim()) errors[`medicine-${index}-frequency`] = 'Frequency is required'
    if (!medicine.duration.trim()) errors[`medicine-${index}-duration`] = 'Duration is required'
  })
  return errors
}

import type { Prescription } from '../types'
import { downloadTextFile, formatDate } from './format'

export function prescriptionToText(rx: Prescription): string {
  return [
    `PRESCRIPTION ${rx.id}`,
    `Doctor: ${rx.doctorName}`,
    `Patient: ${rx.patientName}`,
    `Appointment date: ${formatDate(rx.appointmentDate)}`,
    `Issued: ${formatDate(rx.issuedAt.slice(0, 10))}`,
    `Diagnosis: ${rx.diagnosis}`,
    '',
    'Medicines:',
    ...rx.medicines.map((medicine, index) => `${index + 1}. ${medicine.name} - ${medicine.dosage}, ${medicine.frequency}, ${medicine.duration}. ${medicine.instructions}`),
    '',
    `Tests: ${rx.tests.join(', ') || 'None'}`,
    `Advice: ${rx.advice || 'None'}`,
    `Follow-up: ${rx.followUpDate ? formatDate(rx.followUpDate) : 'Not required'}`,
  ].join('\n')
}

export function downloadPrescription(rx: Prescription): void {
  downloadTextFile(`prescription-${rx.id}.txt`, prescriptionToText(rx))
}

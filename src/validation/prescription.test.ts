import { validatePrescription } from './index'

const medicine = { name: 'Paracetamol', dosage: '1 tablet', frequency: 'Twice a day', duration: '3 days', instructions: '' }

test('requires diagnosis and at least one medicine', () => {
  const errors = validatePrescription({ diagnosis: '', medicines: [], tests: '', advice: '', followUpDate: '' })
  expect(errors.diagnosis).toBeTruthy()
  expect(errors.medicines).toBeTruthy()
})

test('flags incomplete medicine rows', () => {
  const errors = validatePrescription({ diagnosis: 'Flu', medicines: [{ ...medicine, name: '', duration: '' }], tests: '', advice: '', followUpDate: '' })
  expect(errors['medicine-0-name']).toBeTruthy()
  expect(errors['medicine-0-duration']).toBeTruthy()
})

test('passes with a complete prescription', () => {
  expect(validatePrescription({ diagnosis: 'Flu', medicines: [medicine], tests: '', advice: '', followUpDate: '' })).toEqual({})
})

import { render, screen } from '@testing-library/react'
import { CancelAppointmentModal } from './AppointmentModals'
import { buildMockAppointments } from '../data/mockData'

test('cancel dialog shows the refund amount before confirming', async () => {
  const paid = buildMockAppointments().find((item) => item.paymentStatus === 'PAID' && item.status === 'CONFIRMED')!
  render(<CancelAppointmentModal appointment={paid} onClose={() => undefined} onDone={() => undefined} />)
  const preview = await screen.findByTestId('refund-preview')
  expect(preview.textContent).toContain('Refund amount')
  expect(screen.getByText('Confirm cancellation').closest('button')?.hasAttribute('disabled')).toBe(true)
})

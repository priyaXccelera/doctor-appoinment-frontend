import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorAppointments } from './DoctorAppointments';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorAppointments />
    </MemoryRouter>
  );
});

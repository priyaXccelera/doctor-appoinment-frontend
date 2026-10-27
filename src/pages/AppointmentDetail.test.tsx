import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppointmentDetail } from './AppointmentDetail';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <AppointmentDetail />
    </MemoryRouter>
  );
});

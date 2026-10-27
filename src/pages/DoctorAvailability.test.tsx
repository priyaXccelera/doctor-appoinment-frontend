import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorAvailability } from './DoctorAvailability';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorAvailability />
    </MemoryRouter>
  );
});

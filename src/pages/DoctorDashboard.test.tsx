import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorDashboard } from './DoctorDashboard';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorDashboard />
    </MemoryRouter>
  );
});

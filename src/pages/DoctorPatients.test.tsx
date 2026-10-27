import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorPatients } from './DoctorPatients';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorPatients />
    </MemoryRouter>
  );
});

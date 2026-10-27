import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorProfile } from './DoctorProfile';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorProfile />
    </MemoryRouter>
  );
});

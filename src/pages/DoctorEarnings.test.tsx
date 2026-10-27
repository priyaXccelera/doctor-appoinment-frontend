import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorEarnings } from './DoctorEarnings';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorEarnings />
    </MemoryRouter>
  );
});

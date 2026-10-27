import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorSearch } from './DoctorSearch';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorSearch />
    </MemoryRouter>
  );
});

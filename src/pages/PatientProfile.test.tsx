import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientProfile } from './PatientProfile';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <PatientProfile />
    </MemoryRouter>
  );
});

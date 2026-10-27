import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorPatientHistory } from './DoctorPatientHistory';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorPatientHistory />
    </MemoryRouter>
  );
});

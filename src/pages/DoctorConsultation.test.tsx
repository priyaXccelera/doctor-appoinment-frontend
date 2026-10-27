import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorConsultation } from './DoctorConsultation';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorConsultation />
    </MemoryRouter>
  );
});

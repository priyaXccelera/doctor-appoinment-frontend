import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorReviews } from './DoctorReviews';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorReviews />
    </MemoryRouter>
  );
});

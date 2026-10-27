import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrescriptionDetail } from './PrescriptionDetail';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <PrescriptionDetail />
    </MemoryRouter>
  );
});

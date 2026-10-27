import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminVerification } from './AdminVerification';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <AdminVerification />
    </MemoryRouter>
  );
});

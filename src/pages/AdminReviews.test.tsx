import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminReviews } from './AdminReviews';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <AdminReviews />
    </MemoryRouter>
  );
});

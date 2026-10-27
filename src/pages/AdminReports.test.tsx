import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminReports } from './AdminReports';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <AdminReports />
    </MemoryRouter>
  );
});

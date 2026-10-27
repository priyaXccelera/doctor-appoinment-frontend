import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSettings } from './AdminSettings';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <AdminSettings />
    </MemoryRouter>
  );
});

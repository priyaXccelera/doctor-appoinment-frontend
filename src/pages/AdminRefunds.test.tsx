import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRefunds } from './AdminRefunds';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <AdminRefunds />
    </MemoryRouter>
  );
});

import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Notifications } from './Notifications';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>
  );
});

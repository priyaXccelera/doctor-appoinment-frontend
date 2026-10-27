import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyAppointments } from './MyAppointments';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <MyAppointments />
    </MemoryRouter>
  );
});

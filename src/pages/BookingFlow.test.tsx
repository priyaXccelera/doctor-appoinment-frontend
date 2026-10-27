import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BookingFlow } from './BookingFlow';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <BookingFlow />
    </MemoryRouter>
  );
});

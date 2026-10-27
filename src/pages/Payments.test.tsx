import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Payments } from './Payments';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <Payments />
    </MemoryRouter>
  );
});

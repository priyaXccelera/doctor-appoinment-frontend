import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Prescriptions } from './Prescriptions';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <Prescriptions />
    </MemoryRouter>
  );
});

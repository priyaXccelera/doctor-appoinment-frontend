import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FamilyMembers } from './FamilyMembers';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <FamilyMembers />
    </MemoryRouter>
  );
});

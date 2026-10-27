import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DoctorProfileEditor } from './DoctorProfileEditor';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <DoctorProfileEditor />
    </MemoryRouter>
  );
});

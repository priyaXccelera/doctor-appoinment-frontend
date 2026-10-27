import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MedicalRecords } from './MedicalRecords';

test('renders without crashing', () => {
  render(
    <MemoryRouter>
      <MedicalRecords />
    </MemoryRouter>
  );
});

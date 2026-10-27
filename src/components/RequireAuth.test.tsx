import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/not-authorized" element={<p>not authorized page</p>} />
        <Route element={<RequireAuth roles={['ADMIN']} />}>
          <Route path="/admin" element={<p>admin area</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())

test('redirects logged-out visitors to login', () => {
  renderAt('/admin')
  expect(screen.getByText('login page')).toBeTruthy()
})

test('blocks a patient from the admin area', () => {
  localStorage.setItem('auth_token', JSON.stringify({ token: 't', id: 'u1', name: 'P', email: 'p@x.com', role: 'PATIENT' }))
  renderAt('/admin')
  expect(screen.getByText('not authorized page')).toBeTruthy()
})

test('lets an admin through', () => {
  localStorage.setItem('auth_token', JSON.stringify({ token: 't', id: 'u1', name: 'A', email: 'a@x.com', role: 'ADMIN' }))
  renderAt('/admin')
  expect(screen.getByText('admin area')).toBeTruthy()
})

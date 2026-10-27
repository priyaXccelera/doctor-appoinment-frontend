import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { THEME_KEY } from './constants'
import { router } from './routes'
import './index.css'

// Apply the saved theme before first paint so auth screens respect dark mode too.
document.documentElement.classList.toggle('dark', localStorage.getItem(THEME_KEY) === 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

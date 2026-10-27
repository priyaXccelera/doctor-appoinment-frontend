# doctorAppointment

MediBook is a Practo-style web frontend for booking doctor appointments. Patients search doctors, book clinic or video slots through a 5-step flow with slot holds and mock payment, and manage appointments, prescriptions, records and family members. Doctors manage schedule, consultations and earnings; admins verify doctors, moderate content and view analytics.

## Tech stack
React + TypeScript, Vite, Tailwind CSS, React Router, axios, recharts, react-hot-toast, Vitest.

## Getting started
```
npm install --legacy-peer-deps
cp .env.example .env
npm run dev
```
Then open http://localhost:43659

Docker: `docker build -t medibook . && docker run -p 8080:80 medibook`

## Environment variables
See .env.example. `VITE_API_URL` is the backend base URL (API base path `/api/v1`). `VITE_DEMO_MODE` defaults to demo mode (sample data kept in localStorage, no backend needed); set it to `false` to call the backend. Each store module (`src/data/store.ts`, `doctorStore.ts`, `adminStore.ts`, `src/auth/auth.ts`) has a `USE_MOCK` flag derived from it.

## Demo credentials
Password for every account: `Clinic@123`
- Admin: admin@clinic.com
- Doctors: doctor1@clinic.com ... doctor5@clinic.com
- Patients: patient1@mail.com ... patient5@mail.com (patient5 is blocked)

## Tests
`npm test` runs slot picker logic, booking hold/conflict/expiry, refund display in the cancel dialog, prescription validation, role-based route protection, and page smoke tests.

## Project structure
- src/pages - route screens (public, patient, doctor, admin)
- src/components - layouts, sidebar/top bar, slot picker, modals, UI kit
- src/data - mock data, localStorage collections and gated store modules
- src/api - shared axios client with error toasts
- src/auth - mock/real auth gate and session helpers
- src/hooks - shared hooks (async, countdown, meta/SEO, theme)
- src/constants - shared constants and status styling
- src/validation - reusable validators
- src/utils - date/currency formatting, slot generation, refund, calendar helpers
- src/routes - router with role guards

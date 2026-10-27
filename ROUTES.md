# doctorAppointment — Routes & Navigation

## How to run
cd /workspace/frontend_runs/d81777b0-52f3-41f2-a532-3639dd613532/project
npm install --legacy-peer-deps && npm run dev
Then open http://localhost:43659

## Routes

| Route | Page file | Description |
|-------|-----------|-------------|
| / | src/pages/Home.tsx | Public home: search, specialties, symptoms, top doctors, FAQ |
| /doctors | src/pages/DoctorSearch.tsx | Search with URL-driven filters, facets, sort, pagination, list/map |
| /specialties/:specialty | src/pages/DoctorSearch.tsx | SEO specialty page |
| /doctors/:id | src/pages/DoctorProfile.tsx | Doctor profile tabs + sticky slot booking panel |
| /book | src/pages/BookingFlow.tsx | 5-step booking stepper (PATIENT) |
| /login | src/pages/Login.tsx | Login with returnTo redirect |
| /register | src/pages/Register.tsx | Sign up (patient/doctor) |
| /forgot-password | src/pages/ForgotPassword.tsx | Password reset request |
| /not-authorized | src/pages/NotAuthorized.tsx | 403 page |
| /appointments | src/pages/MyAppointments.tsx | Upcoming/Completed/Cancelled tabs, reschedule/cancel/review modals |
| /appointments/:id | src/pages/AppointmentDetail.tsx | Timeline, prescription, notes |
| /prescriptions | src/pages/Prescriptions.tsx | Prescription list |
| /prescriptions/:id | src/pages/PrescriptionDetail.tsx | Prescription detail, print/download |
| /records | src/pages/MedicalRecords.tsx | Upload/preview/delete records |
| /family | src/pages/FamilyMembers.tsx | Family member CRUD |
| /profile | src/pages/PatientProfile.tsx | Profile, password, privacy, language |
| /payments | src/pages/Payments.tsx | Payment history |
| /notifications | src/pages/Notifications.tsx | Notification list (any signed-in role) |
| /notification-preferences | src/pages/NotificationPreferences.tsx | Type and channel toggles |
| /doctor | redirects | Redirects to /doctor/dashboard |
| /doctor/dashboard | src/pages/DoctorDashboard.tsx | Today timeline, counts, earnings, next patient |
| /doctor/appointments | src/pages/DoctorAppointments.tsx | Day/week/list views, drawer, status actions |
| /doctor/consultation/:id | src/pages/DoctorConsultation.tsx | Notes and prescription builder |
| /doctor/availability | src/pages/DoctorAvailability.tsx | Weekly schedule, leaves, overrides, preview |
| /doctor/patients | src/pages/DoctorPatients.tsx | Patients list with search |
| /doctor/patients/:id | src/pages/DoctorPatientHistory.tsx | Patient history timeline |
| /doctor/reviews | src/pages/DoctorReviews.tsx | Reviews with reply modal |
| /doctor/earnings | src/pages/DoctorEarnings.tsx | Earnings, chart, CSV export |
| /doctor/profile | src/pages/DoctorProfileEditor.tsx | Profile editor and verification documents |
| /admin | redirects | Redirects to /admin/dashboard |
| /admin/dashboard | src/pages/AdminDashboard.tsx | Analytics charts |
| /admin/verification | src/pages/AdminVerification.tsx | Doctor verification queue |
| /admin/master-data | src/pages/AdminMasterData.tsx | Specialties, symptom mapping, cities |
| /admin/users | src/pages/AdminUsers.tsx | Users with block/unblock |
| /admin/refunds | src/pages/AdminRefunds.tsx | Refunds and disputes |
| /admin/reviews | src/pages/AdminReviews.tsx | Review moderation |
| /admin/settings | src/pages/AdminSettings.tsx | Platform settings |
| /admin/reports | src/pages/AdminReports.tsx | Reports with CSV export |
| * | src/pages/NotFound.tsx | 404 with Go Home |

## Navigation map
- Home -> DoctorSearch (search submit, specialty tiles, symptom chips, video callout)
- Home -> DoctorProfile (top doctors cards)
- DoctorSearch -> DoctorProfile (card, Book Clinic Visit / Video Consult buttons)
- DoctorProfile -> BookingFlow (Book; redirects to Login with returnTo when signed out)
- BookingFlow -> DoctorProfile (hold expiry, Modify slot, Change slot)
- BookingFlow -> MyAppointments (Back to appointments)
- MyAppointments -> AppointmentDetail (click doctor); -> DoctorProfile (follow-up)
- AppointmentDetail -> PrescriptionDetail; Prescriptions -> PrescriptionDetail
- Notifications -> NotificationPreferences; PatientProfile -> NotificationPreferences
- Login -> returnTo URL or role home (patient /, doctor /doctor/dashboard, admin /admin/dashboard)
- Login -> ForgotPassword / Register
- DoctorDashboard -> DoctorConsultation (Start consultation); -> DoctorAppointments (timeline); -> DoctorReviews
- DoctorAppointments -> DoctorConsultation (Start / Open)
- DoctorPatients -> DoctorPatientHistory (click row)
- Wrong role -> NotAuthorized; unknown URL -> NotFound
- Sidebar (role based): Patient, Doctor, Admin menus via NavLink

## Shared components
- src/components/ui.tsx: Avatar, StatusBadge, Chip, Skeleton, EmptyState, ErrorState, Modal, Drawer, ConfirmDialog, Pagination, Stars, Tabs, Toggle, Field, Stat
- Sidebar.tsx / TopBar.tsx / AppLayout.tsx: role-based dashboard shell, notification bell, theme toggle, user menu
- PublicLayout.tsx / Footer.tsx: public shell
- RequireAuth.tsx: login redirect and role guard
- SlotPicker.tsx: 7-day strip, grouped time slots, next-available jump
- DoctorCard.tsx, Stepper.tsx, CountdownBadge.tsx
- AppointmentActions.tsx, AppointmentModals.tsx (cancel with refund, reschedule with hold timer, review)

## Design tokens
canvas, card, ink, muted, line, primary (DEFAULT, dark, soft, text), success (+soft), warn (+soft), info (+soft), danger (+soft), violet (+soft), neutral (+soft). Values are CSS variables in src/index.css with a `.dark` override (class-based dark mode).

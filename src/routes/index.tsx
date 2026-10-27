import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '../App'
import { AppLayout } from '../components/AppLayout'
import { PublicLayout } from '../components/PublicLayout'
import { RequireAuth } from '../components/RequireAuth'
import { AdminDashboard } from '../pages/AdminDashboard'
import { AdminMasterData } from '../pages/AdminMasterData'
import { AdminRefunds } from '../pages/AdminRefunds'
import { AdminReports } from '../pages/AdminReports'
import { AdminReviews } from '../pages/AdminReviews'
import { AdminSettings } from '../pages/AdminSettings'
import { AdminUsers } from '../pages/AdminUsers'
import { AdminVerification } from '../pages/AdminVerification'
import { AppointmentDetail } from '../pages/AppointmentDetail'
import { BookingFlow } from '../pages/BookingFlow'
import { DoctorAppointments } from '../pages/DoctorAppointments'
import { DoctorAvailability } from '../pages/DoctorAvailability'
import { DoctorConsultation } from '../pages/DoctorConsultation'
import { DoctorDashboard } from '../pages/DoctorDashboard'
import { DoctorEarnings } from '../pages/DoctorEarnings'
import { DoctorPatientHistory } from '../pages/DoctorPatientHistory'
import { DoctorPatients } from '../pages/DoctorPatients'
import { DoctorProfile } from '../pages/DoctorProfile'
import { DoctorProfileEditor } from '../pages/DoctorProfileEditor'
import { DoctorReviews } from '../pages/DoctorReviews'
import { DoctorSearch } from '../pages/DoctorSearch'
import { FamilyMembers } from '../pages/FamilyMembers'
import { ForgotPassword } from '../pages/ForgotPassword'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { MedicalRecords } from '../pages/MedicalRecords'
import { MyAppointments } from '../pages/MyAppointments'
import { NotAuthorized } from '../pages/NotAuthorized'
import { NotFound } from '../pages/NotFound'
import { NotificationPreferences } from '../pages/NotificationPreferences'
import { Notifications } from '../pages/Notifications'
import { PatientProfile } from '../pages/PatientProfile'
import { Payments } from '../pages/Payments'
import { PrescriptionDetail } from '../pages/PrescriptionDetail'
import { Prescriptions } from '../pages/Prescriptions'
import { Register } from '../pages/Register'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'doctors', element: <DoctorSearch /> },
          { path: 'specialties/:specialty', element: <DoctorSearch /> },
          { path: 'doctors/:id', element: <DoctorProfile /> },
          {
            element: <RequireAuth roles={['PATIENT']} />,
            children: [{ path: 'book', element: <BookingFlow /> }],
          },
        ],
      },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'not-authorized', element: <NotAuthorized /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'notifications', element: <Notifications /> },
              { path: 'notification-preferences', element: <NotificationPreferences /> },
              {
                element: <RequireAuth roles={['PATIENT']} />,
                children: [
                  { path: 'appointments', element: <MyAppointments /> },
                  { path: 'appointments/:id', element: <AppointmentDetail /> },
                  { path: 'prescriptions', element: <Prescriptions /> },
                  { path: 'prescriptions/:id', element: <PrescriptionDetail /> },
                  { path: 'records', element: <MedicalRecords /> },
                  { path: 'family', element: <FamilyMembers /> },
                  { path: 'profile', element: <PatientProfile /> },
                  { path: 'payments', element: <Payments /> },
                ],
              },
              {
                path: 'doctor',
                element: <RequireAuth roles={['DOCTOR']} />,
                children: [
                  { index: true, element: <Navigate to="/doctor/dashboard" replace /> },
                  { path: 'dashboard', element: <DoctorDashboard /> },
                  { path: 'appointments', element: <DoctorAppointments /> },
                  { path: 'consultation/:id', element: <DoctorConsultation /> },
                  { path: 'availability', element: <DoctorAvailability /> },
                  { path: 'patients', element: <DoctorPatients /> },
                  { path: 'patients/:id', element: <DoctorPatientHistory /> },
                  { path: 'reviews', element: <DoctorReviews /> },
                  { path: 'earnings', element: <DoctorEarnings /> },
                  { path: 'profile', element: <DoctorProfileEditor /> },
                ],
              },
              {
                path: 'admin',
                element: <RequireAuth roles={['ADMIN']} />,
                children: [
                  { index: true, element: <Navigate to="/admin/dashboard" replace /> },
                  { path: 'dashboard', element: <AdminDashboard /> },
                  { path: 'verification', element: <AdminVerification /> },
                  { path: 'master-data', element: <AdminMasterData /> },
                  { path: 'users', element: <AdminUsers /> },
                  { path: 'refunds', element: <AdminRefunds /> },
                  { path: 'reviews', element: <AdminReviews /> },
                  { path: 'settings', element: <AdminSettings /> },
                  { path: 'reports', element: <AdminReports /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

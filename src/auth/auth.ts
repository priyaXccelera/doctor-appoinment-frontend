import { AUTH_KEY } from '../constants'
import { loadList, newId, saveList } from '../data/collection'
import { mockUsers } from '../data/mockData'
import { remote, ApiError } from '../api/client'
import type { AuthToken, Doctor, Role, User } from '../types'

// TODO(USE_MOCK): verify path + response shape against the real
// backend's OpenAPI schema before flipping this to false.
export const USE_MOCK = import.meta.env.VITE_DEMO_MODE !== 'false'

export function getUsers(): User[] {
  return loadList<User>('users', () => mockUsers)
}

function persistToken(user: User) {
  const token: AuthToken = {
    token: `mock-token-${user.id}`,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorId: user.doctorId,
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(token))
}

// MOCK: stands in for POST /auth/login returning { token, user }
async function localLogin(identifier: string, password: string): Promise<boolean> {
  const needle = identifier.trim().toLowerCase()
  const user = getUsers().find(
    (item) => (item.email.toLowerCase() === needle || item.mobile === needle) && item.password === password,
  )
  if (!user) return false
  if (user.status === 'BLOCKED') {
    throw new ApiError('ACCOUNT_BLOCKED', 'Your account has been blocked. Contact support.', 403)
  }
  persistToken(user)
  return true
}

export async function login(identifier: string, password: string): Promise<boolean> {
  if (USE_MOCK) return localLogin(identifier, password)
  const data = await remote<AuthToken & { accessToken?: string }>('post', '/auth/login', { identifier, password })
  localStorage.setItem(AUTH_KEY, JSON.stringify({ ...data, token: data.token ?? data.accessToken }))
  return true
}

export interface SignupInput {
  name: string
  email: string
  mobile: string
  password: string
  role: Role
}

function blankDoctor(id: string, name: string): Doctor {
  return {
    id,
    name,
    photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=ffffff&size=200`,
    gender: 'Male',
    specialties: ['General Physician'],
    qualifications: [],
    experienceYears: 0,
    rating: 0,
    reviewCount: 0,
    languages: ['English'],
    clinics: [],
    consultationFees: { clinic: 500, video: 400 },
    modes: ['CLINIC', 'VIDEO'],
    about: '',
    services: [],
    registrationNo: '',
    council: '',
    verification: 'PENDING',
    documents: [],
    faqs: [],
    payAtClinic: true,
    manualApproval: false,
  }
}

// MOCK: stands in for POST /auth/register
async function localSignup(input: SignupInput): Promise<User> {
  const users = getUsers()
  if (users.some((item) => item.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ApiError('VALIDATION_ERROR', 'An account with this email already exists', 422, [
      { field: 'email', message: 'Email already registered' },
    ])
  }
  const user: User = {
    id: newId('u'),
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    password: input.password,
    role: input.role,
    status: 'ACTIVE',
    language: 'English',
    privacy: { shareRecords: true, showProfile: false },
  }
  if (input.role === 'DOCTOR') {
    user.doctorId = newId('d')
    const doctors = loadList<Doctor>('doctors', () => [])
    doctors.push(blankDoctor(user.doctorId, input.name))
    saveList('doctors', doctors)
  }
  saveList('users', [...users, user])
  persistToken(user)
  return user
}

export async function signup(input: SignupInput): Promise<User | AuthToken> {
  if (USE_MOCK) return localSignup(input)
  const data = await remote<AuthToken>('post', '/auth/register', input)
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  return data
}

export async function forgotPassword(identifier: string): Promise<void> {
  if (USE_MOCK) {
    // MOCK: no email is actually sent
    void identifier
    return
  }
  await remote('post', '/auth/forgot-password', { identifier })
}

export async function changePassword(current: string, next: string): Promise<void> {
  if (!USE_MOCK) {
    await remote('post', '/auth/change-password', { currentPassword: current, newPassword: next })
    return
  }
  const auth = currentUser()
  const users = getUsers()
  const user = users.find((item) => item.id === auth?.id)
  if (!user || user.password !== current) {
    throw new ApiError('VALIDATION_ERROR', 'Current password is incorrect', 422, [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ])
  }
  user.password = next
  saveList('users', users)
}

export async function logout(): Promise<void> {
  if (!USE_MOCK) {
    try {
      await remote('post', '/auth/logout')
    } catch {
      // token is cleared regardless
    }
  }
  localStorage.removeItem(AUTH_KEY)
}

export function currentUser(): AuthToken | null {
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthToken
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return currentUser() !== null
}

export function currentRole(): Role | null {
  return currentUser()?.role ?? null
}

export function homePathForRole(role: Role | null): string {
  if (role === 'DOCTOR') return '/doctor/dashboard'
  if (role === 'ADMIN') return '/admin/dashboard'
  return '/'
}

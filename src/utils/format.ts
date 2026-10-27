const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Mon, 12 Mar 2026 */
export function formatDate(iso: string): string {
  if (!iso) return '-'
  const date = parseISODate(iso.slice(0, 10))
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

export function formatShortDay(iso: string): { weekday: string; day: number; month: string } {
  const date = parseISODate(iso)
  return { weekday: DAY_NAMES[date.getDay()], day: date.getDate(), month: MONTH_NAMES[date.getMonth()] }
}

/** 14:30 -> 2:30 PM */
export function formatTime(time: string): string {
  if (!time) return '-'
  const [hours, minutes] = time.split(':').map(Number)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const display = hours % 12 === 0 ? 12 : hours % 12
  return `${display}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return `${formatDate(toISODate(date))}, ${formatTime(`${date.getHours()}:${date.getMinutes()}`)}`
}

export function relativeTime(isoTimestamp: string): string {
  const diffSeconds = Math.round((Date.now() - new Date(isoTimestamp).getTime()) / 1000)
  const abs = Math.abs(diffSeconds)
  const suffix = diffSeconds >= 0 ? 'ago' : 'from now'
  if (abs < 60) return 'just now'
  if (abs < 3600) return `${Math.floor(abs / 60)} min ${suffix}`
  if (abs < 86400) return `${Math.floor(abs / 3600)} hr ${suffix}`
  return `${Math.floor(abs / 86400)} d ${suffix}`
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function ageFromDob(dateOfBirth: string): number {
  if (!dateOfBirth) return 0
  const dob = parseISODate(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

export function appointmentStart(date: string, startTime: string): Date {
  const [hours, minutes] = startTime.split(':').map(Number)
  const start = parseISODate(date)
  start.setHours(hours, minutes, 0, 0)
  return start
}

export function downloadTextFile(fileName: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

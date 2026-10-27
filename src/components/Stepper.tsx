import { Check } from 'lucide-react'

export const BOOKING_STEPS = ['Confirm slot', 'Patient & reason', 'Review', 'Payment', 'Confirmation']

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Booking progress">
      {BOOKING_STEPS.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done ? 'bg-success-soft text-success' : active ? 'bg-primary text-white' : 'bg-line text-muted'
              }`}
            >
              {done ? <Check size={16} /> : index + 1}
            </span>
            <span className={`hidden text-xs font-medium md:block ${active ? 'text-ink' : 'text-muted'}`}>{label}</span>
            {index < BOOKING_STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        )
      })}
    </ol>
  )
}

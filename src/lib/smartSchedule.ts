import type { Activity } from '../types'

// Smart pill scheduling: when NAC is checked, shift dependent activities
// based on the actual time it was taken.
//
// Chain:
//   NAC taken at X →
//     Olio di cocco      → X + 30min
//     Immunomix mattina  → X + 2h
//     Collagene PRE      → X + 1h (before gym, reasonable gap)

interface DepRule {
  match: string       // substring to match in title
  offsetMin: number   // minutes after NAC
}

const NAC_DEPS: DepRule[] = [
  { match: 'olio di cocco', offsetMin: 30 },
  { match: 'collagene pre', offsetMin: 60 },
  { match: 'immunomix x2 + psicobrain mattina', offsetMin: 120 },
]

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function nowHHMM(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

/**
 * When NAC is toggled ON, recalculate times of dependent activities.
 * Returns updated activities array for the day, or null if no changes needed.
 */
export function applySmartSchedule(
  actId: number,
  isChecking: boolean,
  dayActs: Activity[]
): Activity[] | null {
  // Only trigger when checking (not unchecking)
  if (!isChecking) return null

  // Find the activity being toggled
  const act = dayActs.find((a) => a.id === actId)
  if (!act) return null

  // Only trigger for NAC
  if (!act.title.toLowerCase().includes('nac')) return null

  const nacTime = nowHHMM()
  let changed = false
  const updated = dayActs.map((a) => {
    const lower = a.title.toLowerCase()
    for (const dep of NAC_DEPS) {
      if (lower.includes(dep.match)) {
        const newTime = addMinutes(nacTime, dep.offsetMin)
        if (a.time !== newTime) {
          changed = true
          return { ...a, time: newTime }
        }
      }
    }
    return a
  })

  return changed ? updated : null
}

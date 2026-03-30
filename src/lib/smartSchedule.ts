import type { Activity } from '../types'

// Smart pill scheduling
//
// NAC chain (only morning session depends on NAC timing):
//   NAC taken at X →
//     Olio di cocco                → X + 30min
//     Immunomix + Psicobrain matt  → X + 2h
//
// Everything else is anchored to meals, not NAC:
//   Collagene PRE    → before gym (fixed)
//   Collagene POST   → after gym (fixed)
//   Omega3 pranzo    → with lunch (fixed)
//   Immunomix pom    → mid-afternoon (fixed)
//   Omega3 + D3+K2   → with dinner (fixed)
//   Protectin        → bedtime (fixed)

interface DepRule {
  match: string
  offsetMin: number
}

const NAC_DEPS: DepRule[] = [
  { match: 'olio di cocco', offsetMin: 30 },
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
 * Only olio di cocco (+30min) and Immunomix mattina (+2h) shift.
 * Returns updated activities array for the day, or null if no changes.
 */
export function applySmartSchedule(
  actId: number,
  isChecking: boolean,
  dayActs: Activity[]
): Activity[] | null {
  if (!isChecking) return null

  const act = dayActs.find((a) => a.id === actId)
  if (!act) return null

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

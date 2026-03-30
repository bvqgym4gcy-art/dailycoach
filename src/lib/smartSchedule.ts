import type { Activity } from '../types'

// ─── Smart Schedule Engine ──────────────────────────────────
//
// Dependency chains — when an "anchor" activity changes time,
// all its dependents shift automatically.
//
// CHAINS:
//
// NAC (on check, uses current time):
//   → Olio di cocco         = NAC + 30min
//   → Immunomix mattina     = NAC + 2h
//
// Palestra (on time change):
//   → Collagene PRE         = Palestra same time (take it right before)
//   → Collagene POST        = Palestra + 1h15min
//
// Pranzo (on time change):
//   → Omega3+Berberol pranzo = Pranzo same time
//
// Cena (on time change):
//   → Omega3+Berberol+D3+K2  = Cena same time

interface DepChain {
  anchor: string       // substring match for the anchor activity
  deps: { match: string; offsetMin: number }[]
}

const CHAINS: DepChain[] = [
  {
    anchor: 'palestra',
    deps: [
      { match: 'collagene pre', offsetMin: 0 },
      { match: 'collagene post', offsetMin: 75 },
    ],
  },
  {
    anchor: 'pranzo',
    deps: [
      { match: 'omega3+coq10 + berberol pranzo', offsetMin: 0 },
    ],
  },
  {
    anchor: 'cena',
    deps: [
      { match: 'omega3+coq10 + berberol + d3+k2', offsetMin: 0 },
    ],
  },
]

// NAC is special: triggers on check (not time change), uses real clock
const NAC_DEPS = [
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
 * Called when NAC is checked — shifts morning pills based on real time.
 */
export function applyNacSchedule(dayActs: Activity[]): Activity[] | null {
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

/**
 * Called when any activity's time is changed (edit/move).
 * Checks if the changed activity is an anchor and shifts its dependents.
 */
export function applyChainSchedule(
  changedAct: Activity,
  newTime: string,
  dayActs: Activity[]
): Activity[] | null {
  const lowerTitle = changedAct.title.toLowerCase()

  // Find which chain this activity anchors
  const chain = CHAINS.find((c) => lowerTitle.includes(c.anchor))
  if (!chain) return null

  let changed = false
  const updated = dayActs.map((a) => {
    const lower = a.title.toLowerCase()
    for (const dep of chain.deps) {
      if (lower.includes(dep.match)) {
        const depTime = addMinutes(newTime, dep.offsetMin)
        if (a.time !== depTime) {
          changed = true
          return { ...a, time: depTime }
        }
      }
    }
    return a
  })

  return changed ? updated : null
}

/**
 * Convenience: called on toggle. Only triggers for NAC.
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
  return applyNacSchedule(dayActs)
}

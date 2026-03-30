import type { Activity, ScheduleRule } from '../types'

// ─── Smart Schedule Engine ──────────────────────────────────
//
// Rules live in the database and evolve over time.
// When user manually corrects an offset, the rule updates.
//
// Default rules (seeded on first load):
//
// ON CHECK (NAC):
//   → Olio di cocco         = NAC + 30min
//   → Immunomix mattina     = NAC + 2h
//
// ON MOVE (Palestra):
//   → Collagene PRE         = same time
//   → Collagene POST        = +75min
//
// ON MOVE (Pranzo):
//   → Omega3+Berberol pranzo = same time
//
// ON MOVE (Cena):
//   → Omega3+Berberol+D3+K2  = same time

export const DEFAULT_RULES: ScheduleRule[] = [
  // NAC chain (on check)
  { anchor: 'nac', dependent: 'olio di cocco', offsetMin: 30, trigger: 'check', learned: 0 },
  { anchor: 'nac', dependent: 'immunomix x2 + psicobrain mattina', offsetMin: 120, trigger: 'check', learned: 0 },
  // Palestra chain (on move)
  { anchor: 'palestra', dependent: 'collagene pre', offsetMin: 0, trigger: 'move', learned: 0 },
  { anchor: 'palestra', dependent: 'collagene post', offsetMin: 75, trigger: 'move', learned: 0 },
  // Pranzo chain (on move)
  { anchor: 'pranzo', dependent: 'omega3+coq10 + berberol pranzo', offsetMin: 0, trigger: 'move', learned: 0 },
  // Cena chain (on move)
  { anchor: 'cena', dependent: 'omega3+coq10 + berberol + d3+k2', offsetMin: 0, trigger: 'move', learned: 0 },
]

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function diffMinutes(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (bh * 60 + bm) - (ah * 60 + am)
}

function nowHHMM(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

function matchesRule(title: string, keyword: string): boolean {
  return title.toLowerCase().includes(keyword)
}

/**
 * Apply rules when an activity is checked off.
 * Returns [updatedActs, updatedRules] or null if no changes.
 */
export function applyCheckRules(
  actId: number,
  isChecking: boolean,
  dayActs: Activity[],
  rules: ScheduleRule[]
): { acts: Activity[]; rules: ScheduleRule[] } | null {
  if (!isChecking) return null

  const act = dayActs.find((a) => a.id === actId)
  if (!act) return null

  // Find check-triggered rules where this activity is the anchor
  const matchingRules = rules.filter(
    (r) => r.trigger === 'check' && matchesRule(act.title, r.anchor)
  )
  if (matchingRules.length === 0) return null

  const anchorTime = nowHHMM()
  let changed = false

  const updatedActs = dayActs.map((a) => {
    for (const rule of matchingRules) {
      if (matchesRule(a.title, rule.dependent)) {
        const newTime = addMinutes(anchorTime, rule.offsetMin)
        if (a.time !== newTime) {
          changed = true
          return { ...a, time: newTime }
        }
      }
    }
    return a
  })

  return changed ? { acts: updatedActs, rules } : null
}

/**
 * Apply rules when an activity's time is changed (edit).
 * Returns [updatedActs, updatedRules] or null if no changes.
 */
export function applyMoveRules(
  changedAct: Activity,
  newTime: string,
  dayActs: Activity[],
  rules: ScheduleRule[]
): { acts: Activity[]; rules: ScheduleRule[] } | null {
  // Find move-triggered rules where this activity is the anchor
  const matchingRules = rules.filter(
    (r) => r.trigger === 'move' && matchesRule(changedAct.title, r.anchor)
  )
  if (matchingRules.length === 0) return null

  let changed = false
  const updatedActs = dayActs.map((a) => {
    for (const rule of matchingRules) {
      if (matchesRule(a.title, rule.dependent)) {
        const depTime = addMinutes(newTime, rule.offsetMin)
        if (a.time !== depTime) {
          changed = true
          return { ...a, time: depTime }
        }
      }
    }
    return a
  })

  return changed ? { acts: updatedActs, rules } : null
}

/**
 * Learn from user corrections.
 * If the user manually changes the time of a dependent activity
 * after an anchor was already set, update the rule's offset.
 *
 * Call this when user edits any activity's time.
 */
export function learnFromEdit(
  editedAct: Activity,
  newTime: string,
  dayActs: Activity[],
  rules: ScheduleRule[]
): ScheduleRule[] | null {
  // Is this activity a dependent in any rule?
  const depRules = rules.filter((r) => matchesRule(editedAct.title, r.dependent))
  if (depRules.length === 0) return null

  let changed = false
  const updatedRules = rules.map((rule) => {
    if (!matchesRule(editedAct.title, rule.dependent)) return rule

    // Find the anchor activity's current time
    const anchor = dayActs.find((a) => matchesRule(a.title, rule.anchor))
    if (!anchor) return rule

    const actualOffset = diffMinutes(anchor.time, newTime)
    if (actualOffset >= 0 && actualOffset !== rule.offsetMin) {
      changed = true
      return { ...rule, offsetMin: actualOffset, learned: rule.learned + 1 }
    }
    return rule
  })

  return changed ? updatedRules : null
}

// Legacy compat
export function applySmartSchedule(
  actId: number,
  isChecking: boolean,
  dayActs: Activity[],
  rules: ScheduleRule[]
): { acts: Activity[]; rules: ScheduleRule[] } | null {
  return applyCheckRules(actId, isChecking, dayActs, rules)
}

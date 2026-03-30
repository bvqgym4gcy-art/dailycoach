import type { Activity } from '../types'

export function dateKey(d: Date): string {
  // Use LOCAL date, not UTC — prevents wrong day at night
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return dateKey(new Date())
}

export function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

export function fmtLong(d: Date): string {
  return d.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function fmtMonth(d: Date): string {
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

export function nowHHMM(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

export function calcStreak(
  allActs: Record<string, Activity[]>,
  checks: Record<string, Record<number, boolean>>
): number {
  let s = 0
  for (let i = 1; i <= 60; i++) {
    const k = dateKey(addDays(new Date(), -i))
    const acts = (allActs[k] || []).filter((a) => a.streak)
    if (!acts.length) {
      s++
      continue
    }
    if (!acts.some((a) => (checks[k] || {})[a.id])) break
    s++
  }
  return s
}

export function calcBest(
  allActs: Record<string, Activity[]>,
  checks: Record<string, Record<number, boolean>>
): number {
  let best = 0,
    cur = 0
  for (const k of Object.keys(allActs).sort()) {
    const acts = (allActs[k] || []).filter((a) => a.streak)
    if (!acts.length || acts.some((a) => (checks[k] || {})[a.id])) cur++
    else cur = 0
    if (cur > best) best = cur
  }
  return best
}

export function calDays(m: Date): (Date | null)[] {
  const y = m.getFullYear(),
    mo = m.getMonth()
  const offset = (new Date(y, mo, 1).getDay() + 6) % 7
  const dim = new Date(y, mo + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(new Date(y, mo, d))
  return cells
}

export function getWeekDates(curDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(curDate)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + i)
    return new Date(d)
  })
}

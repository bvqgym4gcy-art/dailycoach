import type { Activity } from '../types'

interface CalEvent {
  title: string
  date: string
  time: string
  duration: number
}

function detectCategory(title: string): Activity['category'] {
  const lower = title.toLowerCase()
  if (lower.includes('fisio') || lower.includes('medico') || lower.includes('dottore')) return 'salute'
  if (lower.includes('palestra') || lower.includes('sport') || lower.includes('corsa')) return 'sport'
  if (lower.includes('cena') || lower.includes('pranzo') || lower.includes('compleanno') || lower.includes('aperitivo')) return 'sociale'
  return 'lavoro'
}

function cleanTitle(t: string): string {
  return t.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase()
}

function titlesMatch(a: string, b: string): boolean {
  const ca = cleanTitle(a)
  const cb = cleanTitle(b)
  if (ca === cb) return true
  // Partial match — one contains the start of the other
  if (ca.length > 5 && cb.length > 5) {
    return ca.includes(cb.substring(0, 12)) || cb.includes(ca.substring(0, 12))
  }
  return false
}

export async function fetchLiveCalendar(): Promise<CalEvent[] | null> {
  try {
    const r = await fetch('/api/calendar')
    if (!r.ok) return null
    const data = await r.json()
    return data.events || null
  } catch {
    return null
  }
}

/**
 * Merge live calendar events into allActs.
 * - Adds new events
 * - Removes events no longer on Google Calendar
 * - Deduplicates by title + date (ignores minor time differences)
 */
export function mergeCalendarEvents(
  liveEvents: CalEvent[],
  allActs: Record<string, Activity[]>
): Record<string, Activity[]> | null {
  let changed = false
  const result = { ...allActs }

  // Group live events by date
  const byDate: Record<string, CalEvent[]> = {}
  for (const ev of liveEvents) {
    if (!byDate[ev.date]) byDate[ev.date] = []
    // Deduplicate within live events themselves (same title + same date)
    const dup = byDate[ev.date].some((e) => titlesMatch(e.title, ev.title))
    if (!dup) byDate[ev.date].push(ev)
  }

  // Sync each day
  for (const date of Object.keys(result)) {
    const dayActs = result[date]
    const liveForDay = byDate[date] || []

    // Remove fromCal events that are no longer live
    const filtered = dayActs.filter((a) => {
      if (!a.fromCal) return true
      return liveForDay.some((ev) => titlesMatch(ev.title, a.title))
    })
    if (filtered.length !== dayActs.length) changed = true

    // Add new live events not already present (check against ALL activities, not just fromCal)
    for (const ev of liveForDay) {
      const exists = filtered.some((a) => titlesMatch(a.title, ev.title))
      if (!exists) {
        filtered.push({
          id: Math.abs(hashCode(`${ev.date}-${ev.time}-${ev.title}`)) % 100000000,
          time: ev.time,
          title: ev.title,
          category: detectCategory(ev.title),
          duration: ev.duration,
          streak: false,
          fromCal: true,
        })
        changed = true
      }
    }

    result[date] = filtered
  }

  // Add events for days not yet in allActs
  for (const date of Object.keys(byDate)) {
    if (result[date]) continue
    result[date] = byDate[date].map((ev) => ({
      id: Math.abs(hashCode(`${ev.date}-${ev.time}-${ev.title}`)) % 100000000,
      time: ev.time,
      title: ev.title,
      category: detectCategory(ev.title),
      duration: ev.duration,
      streak: false,
      fromCal: true,
    }))
    changed = true
  }

  return changed ? result : null
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

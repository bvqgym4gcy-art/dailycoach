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

/**
 * Fetch live calendar events from the Vercel serverless proxy.
 * The proxy reads the private iCal feed from Google Calendar.
 */
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
 * Adds new events, removes events that no longer exist on Google Calendar.
 */
export function mergeCalendarEvents(
  liveEvents: CalEvent[],
  allActs: Record<string, Activity[]>
): Record<string, Activity[]> | null {
  let changed = false
  const result = { ...allActs }

  // Build a set of live event keys for quick lookup
  const liveKeys = new Set(liveEvents.map((ev) => `${ev.date}|${ev.time}|${ev.title.toLowerCase()}`))

  // Group live events by date
  const byDate: Record<string, CalEvent[]> = {}
  for (const ev of liveEvents) {
    if (!byDate[ev.date]) byDate[ev.date] = []
    byDate[ev.date].push(ev)
  }

  // For each day that has activities, sync calendar events
  for (const date of Object.keys(result)) {
    const dayActs = result[date]
    const liveForDay = byDate[date] || []

    // Remove calendar events that are no longer on Google Calendar
    const filtered = dayActs.filter((a) => {
      if (!a.fromCal) return true // keep non-calendar activities
      const key = `${date}|${a.time}|${a.title.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase()}`
      // Keep if there's a live event that matches closely
      return liveEvents.some((ev) => {
        const evKey = `${ev.date}|${ev.time}|${ev.title.toLowerCase()}`
        return ev.date === date && (
          ev.title.toLowerCase() === a.title.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase() ||
          a.title.toLowerCase().includes(ev.title.toLowerCase().substring(0, 15)) ||
          ev.title.toLowerCase().includes(a.title.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase().substring(0, 15))
        )
      })
    })

    if (filtered.length !== dayActs.length) changed = true

    // Add new live events that don't exist yet
    for (const ev of liveForDay) {
      const exists = filtered.some((a) =>
        a.fromCal && (
          a.title.toLowerCase().includes(ev.title.toLowerCase().substring(0, 15)) ||
          ev.title.toLowerCase().includes(a.title.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase().substring(0, 15))
        )
      )
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

  // Add events for days that don't exist in allActs yet
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

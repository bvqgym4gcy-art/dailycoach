import type { Activity, CalendarEvent } from '../types'

function detectCategory(title: string): Activity['category'] {
  const lower = title.toLowerCase()
  if (lower.includes('fisio') || lower.includes('medico') || lower.includes('dottore')) return 'salute'
  if (lower.includes('palestra') || lower.includes('sport') || lower.includes('corsa')) return 'sport'
  if (lower.includes('cena') || lower.includes('pranzo') || lower.includes('compleanno') || lower.includes('aperitivo')) return 'sociale'
  return 'lavoro'
}

/**
 * Merge calendar events (from DB) into allActs.
 * Calendar events in AppData.calendarEvents are synced externally
 * (by Claude Code via MCP) and always up to date.
 */
export function mergeCalendarEvents(
  calEvents: CalendarEvent[],
  allActs: Record<string, Activity[]>
): Record<string, Activity[]> | null {
  let changed = false
  const result = { ...allActs }

  for (const ev of calEvents) {
    if (!ev.date || !ev.time) continue

    const dayActs = result[ev.date] || []

    // Check if already exists (fromCal with similar title)
    const exists = dayActs.some((a) => {
      if (!a.fromCal) return false
      const aTitle = a.title.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase()
      const evTitle = ev.title.replace(/[⬡◎⊕✈💰📹]/g, '').trim().toLowerCase()
      return aTitle.includes(evTitle.substring(0, 15)) || evTitle.includes(aTitle.substring(0, 15))
    })
    if (exists) continue

    const newAct: Activity = {
      id: Math.abs(hashCode(`${ev.date}-${ev.time}-${ev.title}`)) % 100000000,
      time: ev.time,
      title: ev.title,
      category: ev.category || detectCategory(ev.title),
      duration: ev.duration || 60,
      streak: false,
      fromCal: true,
    }

    result[ev.date] = [...dayActs, newAct]
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

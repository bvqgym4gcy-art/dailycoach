import type { VercelRequest, VercelResponse } from '@vercel/node'

const ICAL_URL = 'https://calendar.google.com/calendar/ical/stefanodc%40adtucon.io/private-d021ab3e41b23c8501a0d934a41c0f7d/basic.ics'

// Target timezone offset (Europe/Rome)
// CET = UTC+1, CEST = UTC+2 (summer, late March to late October)
function getRomeOffsetHours(date: Date): number {
  // Rough DST check: CEST from last Sunday of March to last Sunday of October
  const month = date.getUTCMonth()
  if (month > 2 && month < 9) return 2  // April–September: CEST
  if (month === 2) { // March: check if after last Sunday
    const lastSun = 31 - new Date(date.getUTCFullYear(), 2, 31).getUTCDay()
    return date.getUTCDate() >= lastSun ? 2 : 1
  }
  if (month === 9) { // October: check if before last Sunday
    const lastSun = 31 - new Date(date.getUTCFullYear(), 9, 31).getUTCDay()
    return date.getUTCDate() < lastSun ? 2 : 1
  }
  return 1 // CET
}

// Known timezone UTC offsets (approximate, ignoring DST edge cases for non-Rome zones)
const TZ_OFFSETS: Record<string, number> = {
  'Europe/Rome': 0,       // handled specially
  'Europe/Dublin': 0,     // will check DST
  'Europe/London': 0,
  'Europe/Warsaw': 0,     // same as Rome (CET/CEST)
  'Asia/Dubai': 4,
  'America/New_York': -5,
  'UTC': 0,
}

function getTzOffsetHours(tzid: string, date: Date): number {
  if (tzid === 'Europe/Rome' || tzid === 'Europe/Warsaw') return getRomeOffsetHours(date)
  if (tzid === 'Europe/Dublin' || tzid === 'Europe/London') {
    // BST: UTC+1 summer, UTC+0 winter
    const month = date.getUTCMonth()
    if (month > 2 && month < 9) return 1
    return 0
  }
  return TZ_OFFSETS[tzid] ?? 0
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  if (_req.method === 'OPTIONS') return res.status(200).end()

  try {
    const response = await fetch(ICAL_URL)
    if (!response.ok) return res.status(502).json({ error: 'Failed to fetch iCal' })

    const ical = await response.text()
    const events = parseICal(ical)
    return res.status(200).json({ events, synced: new Date().toISOString() })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

interface CalEvent {
  title: string
  date: string
  time: string
  duration: number
}

function parseICal(ical: string): CalEvent[] {
  const events: CalEvent[] = []
  const now = new Date()
  const minDate = new Date(now.getTime() - 7 * 86400000)
  const maxDate = new Date(now.getTime() + 90 * 86400000)

  const unfolded = ical.replace(/\r\n[ \t]/g, '')
  const blocks = unfolded.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]

    const get = (key: string): string => {
      const re = new RegExp(`^${key}[;:](.*?)$`, 'm')
      const m = block.match(re)
      return m ? m[1].trim() : ''
    }

    const summary = get('SUMMARY') || ''
    const dtstartRaw = get('DTSTART') || ''
    const dtendRaw = get('DTEND') || ''
    const status = get('STATUS') || ''

    if (!summary || !dtstartRaw) continue
    if (status === 'CANCELLED') continue

    const allDay = !dtstartRaw.includes('T')
    if (allDay) continue

    const startDate = parseICalToRome(dtstartRaw)
    if (!startDate) continue
    if (startDate < minDate || startDate > maxDate) continue

    const date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
    const time = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`

    let duration = 60
    if (dtendRaw) {
      const endDate = parseICalToRome(dtendRaw)
      if (endDate) duration = Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
    }

    events.push({ title: summary, date, time, duration })
  }

  return events
}

/**
 * Parse iCal datetime and convert to Europe/Rome local time.
 * Handles: TZID=Asia/Dubai:20260331T220000, 20260330T093000Z, plain 20260330T110000
 */
function parseICalToRome(raw: string): Date | null {
  // Extract TZID if present
  let tzid = ''
  let dateStr = raw

  // Format: TZID=Europe/Rome:20260330T110000
  const tzMatch = raw.match(/TZID=([^:]+):(.+)/)
  if (tzMatch) {
    tzid = tzMatch[1]
    dateStr = tzMatch[2]
  } else if (raw.includes(':')) {
    dateStr = raw.split(':').pop()!
  }

  dateStr = dateStr.trim()
  if (dateStr.length < 15) return null

  const y = parseInt(dateStr.slice(0, 4))
  const mo = parseInt(dateStr.slice(4, 6)) - 1
  const d = parseInt(dateStr.slice(6, 8))
  const h = parseInt(dateStr.slice(9, 11))
  const min = parseInt(dateStr.slice(11, 13))

  let utcMs: number

  if (dateStr.endsWith('Z')) {
    // Already UTC
    utcMs = Date.UTC(y, mo, d, h, min)
  } else if (tzid) {
    // Convert from source timezone to UTC
    const sourceOffset = getTzOffsetHours(tzid, new Date(Date.UTC(y, mo, d, h, min)))
    utcMs = Date.UTC(y, mo, d, h - sourceOffset, min)
  } else {
    // No timezone — assume Rome
    const romeOffset = getRomeOffsetHours(new Date(Date.UTC(y, mo, d, h, min)))
    utcMs = Date.UTC(y, mo, d, h - romeOffset, min)
  }

  // Convert UTC to Rome local
  const utcDate = new Date(utcMs)
  const romeOffset = getRomeOffsetHours(utcDate)
  return new Date(utcMs + romeOffset * 3600000)
}

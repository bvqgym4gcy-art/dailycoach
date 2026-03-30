import type { VercelRequest, VercelResponse } from '@vercel/node'

const ICAL_URL = 'https://calendar.google.com/calendar/ical/stefanodc%40adtucon.io/private-d021ab3e41b23c8501a0d934a41c0f7d/basic.ics'

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

  // Unfold long lines (iCal spec: lines starting with space/tab continue prev line)
  const unfolded = ical.replace(/\r\n[ \t]/g, '')

  const blocks = unfolded.split('BEGIN:VEVENT')
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]

    const get = (key: string): string => {
      // Match KEY;params:value or KEY:value
      const re = new RegExp(`^${key}[;:](.*?)$`, 'm')
      const m = block.match(re)
      if (!m) return ''
      // Strip parameters (everything after ; before :) and get value after last :
      const full = m[1]
      const colonIdx = full.indexOf(':')
      // If the match included params (from ;), extract value after :
      if (m[0].includes(';') && colonIdx >= 0) return full.substring(colonIdx + 1).trim()
      return full.trim()
    }

    const summary = get('SUMMARY') || ''
    const dtstart = get('DTSTART') || ''
    const dtend = get('DTEND') || ''
    const status = get('STATUS') || ''

    if (!summary || !dtstart) continue
    if (status === 'CANCELLED') continue

    const allDay = !dtstart.includes('T')
    if (allDay) continue // skip all-day for now

    const startDate = parseICalDateTime(dtstart)
    if (!startDate) continue
    if (startDate < minDate || startDate > maxDate) continue

    const date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
    const time = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`

    let duration = 60
    if (dtend) {
      const endDate = parseICalDateTime(dtend)
      if (endDate) duration = Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
    }

    events.push({ title: summary, date, time, duration })
  }

  return events
}

function parseICalDateTime(str: string): Date | null {
  // Remove TZID param if present: TZID=Europe/Rome:20260330T110000
  const clean = str.includes(':') ? str.split(':').pop()! : str

  if (clean.length < 15) return null
  const y = parseInt(clean.slice(0, 4))
  const m = parseInt(clean.slice(4, 6)) - 1
  const d = parseInt(clean.slice(6, 8))
  const h = parseInt(clean.slice(9, 11))
  const min = parseInt(clean.slice(11, 13))

  if (clean.endsWith('Z')) {
    // UTC — convert to local
    return new Date(Date.UTC(y, m, d, h, min))
  }
  // Local time (with TZID or implicit)
  return new Date(y, m, d, h, min)
}

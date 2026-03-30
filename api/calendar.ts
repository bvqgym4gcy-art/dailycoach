// Vercel Serverless Function — Google Calendar iCal Proxy
// Fetches the iCal feed for stefanodc@adtucon.io and returns parsed events as JSON
// No API key needed — uses the standard iCal export URL

import type { VercelRequest, VercelResponse } from '@vercel/node'

const ICAL_URL = process.env.GOOGLE_ICAL_URL || ''
// Fallback: Google Workspace calendars have a private iCal URL
// Format: https://calendar.google.com/calendar/ical/EMAIL/private-HASH/basic.ics

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600') // cache 5min
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!ICAL_URL) {
    return res.status(500).json({ error: 'GOOGLE_ICAL_URL not configured. Set the private iCal URL in Vercel env vars.' })
  }

  try {
    const response = await fetch(ICAL_URL)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch iCal feed' })
    }

    const ical = await response.text()
    const events = parseICal(ical)

    return res.status(200).json({ events, synced: new Date().toISOString() })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

interface ParsedEvent {
  id: string
  title: string
  date: string
  time: string
  duration: number
  allDay: boolean
}

function parseICal(ical: string): ParsedEvent[] {
  const events: ParsedEvent[] = []
  const blocks = ical.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]
    const get = (key: string): string => {
      const match = block.match(new RegExp(`^${key}[;:](.*)$`, 'm'))
      return match ? match[1].trim() : ''
    }

    const uid = get('UID')
    const summary = get('SUMMARY')
    const dtstart = get('DTSTART')
    const dtend = get('DTEND')

    if (!summary || !dtstart) continue

    // Parse date/time
    const allDay = dtstart.includes('VALUE=DATE')
    const startStr = dtstart.replace(/.*:/, '').replace(/VALUE=DATE:?/, '')

    let date = ''
    let time = '00:00'
    let duration = 60

    if (allDay) {
      // Format: 20260330
      date = `${startStr.slice(0, 4)}-${startStr.slice(4, 6)}-${startStr.slice(6, 8)}`
    } else {
      // Format: 20260330T150000Z or 20260330T150000
      const d = parseICalDate(startStr)
      if (d) {
        date = d.toISOString().split('T')[0]
        time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      }

      if (dtend) {
        const endStr = dtend.replace(/.*:/, '')
        const e = parseICalDate(endStr)
        if (d && e) {
          duration = Math.round((e.getTime() - d.getTime()) / 60000)
        }
      }
    }

    // Only include events from today onwards (last 7 days + next 60 days)
    const now = new Date()
    const minDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
    const maxDate = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0]
    if (date < minDate || date > maxDate) continue

    events.push({ id: uid || `${date}-${time}-${summary}`, title: summary, date, time, duration: Math.max(duration, 15), allDay })
  }

  return events
}

function parseICalDate(str: string): Date | null {
  // 20260330T150000Z
  if (str.length < 15) return null
  const y = parseInt(str.slice(0, 4))
  const m = parseInt(str.slice(4, 6)) - 1
  const d = parseInt(str.slice(6, 8))
  const h = parseInt(str.slice(9, 11))
  const min = parseInt(str.slice(11, 13))

  if (str.endsWith('Z')) {
    return new Date(Date.UTC(y, m, d, h, min))
  }
  return new Date(y, m, d, h, min)
}

import type { Activity } from '../types'
import { dateKey } from '../lib/utils'

interface GCalEvent {
  date: string
  time: string
  title: string
  category: Activity['category']
  duration: number
}

export const GCAL: GCalEvent[] = [
  { date: '2026-03-28', time: '01:30', title: '✈ Going to Warsaw', category: 'sociale', duration: 60 },
  { date: '2026-03-30', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-03-30', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-03-31', time: '20:00', title: '◎ Cena (calendario)', category: 'sociale', duration: 90 },
  { date: '2026-04-01', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-01', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan', category: 'lavoro', duration: 50 },
  { date: '2026-04-03', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-06', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-06', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-07', time: '09:00', title: '⊕ Fisio Cassino 9', category: 'salute', duration: 60 },
  { date: '2026-04-08', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-08', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan', category: 'lavoro', duration: 50 },
  { date: '2026-04-10', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-11', time: '10:00', title: '◎ Compleanno Andrea — Roma', category: 'sociale', duration: 120 },
  { date: '2026-04-13', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-13', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-15', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-15', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan', category: 'lavoro', duration: 50 },
  { date: '2026-04-17', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-20', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-20', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-22', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-22', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan', category: 'lavoro', duration: 50 },
  { date: '2026-04-24', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-27', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-27', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-29', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-29', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan', category: 'lavoro', duration: 50 },
]

const BASE_TEMPLATE: Omit<Activity, 'id'>[] = [
  { time: '07:30', title: 'Pillola — NAC 1000mg a digiuno', category: 'salute', duration: 5, streak: true },
  { time: '08:30', title: 'Pillola — Collagene PRE-palestra', category: 'salute', duration: 5, streak: true },
  { time: '09:00', title: 'Palestra', category: 'sport', duration: 60, streak: true },
  { time: '09:00', title: 'Pillola — Immunomix x2 + Psicobrain mattina', category: 'salute', duration: 5, streak: true },
  { time: '10:15', title: 'Pillola — Collagene POST-palestra', category: 'salute', duration: 5, streak: true },
  { time: '13:30', title: 'Pranzo leggero', category: 'routine', duration: 30, streak: false },
  { time: '13:30', title: 'Pillola — Omega3+CoQ10 + Berberol pranzo', category: 'salute', duration: 5, streak: true },
  { time: '16:00', title: 'Pillola — Immunomix x2 + Psicobrain pomeriggio', category: 'salute', duration: 5, streak: true },
  { time: '20:00', title: 'Cena', category: 'routine', duration: 40, streak: false },
  { time: '20:00', title: 'Pillola — Omega3+CoQ10 + Berberol + D3+K2', category: 'salute', duration: 5, streak: true },
  { time: '22:30', title: 'Pillola — Protectin prima di dormire', category: 'salute', duration: 5, streak: true },
]

const TODAY_EXTRA: Omit<Activity, 'id'>[] = [
  { time: '15:00', title: 'Piano pillole settimanale', category: 'lavoro', duration: 60, streak: false },
  { time: '16:30', title: 'Organizza aperitivo con Sabrina', category: 'sociale', duration: 20, streak: false },
  { time: '17:00', title: 'Organizza cena', category: 'sociale', duration: 20, streak: false },
  { time: '18:00', title: 'Newsletter — 1h focus', category: 'lavoro', duration: 60, streak: true },
]

export const HABIT_LIST = [...new Set(BASE_TEMPLATE.filter((a) => a.streak).map((a) => a.title))]

export function buildAll(saved: Record<string, Activity[]> = {}): Record<string, Activity[]> {
  const res = { ...saved }
  const s = new Date('2026-03-28')
  const e = new Date('2026-04-30')
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const k = dateKey(new Date(d))
    if (res[k]) continue
    const gcal: Activity[] = GCAL.filter((ev) => ev.date === k).map((ev, i) => ({
      ...ev,
      id: parseInt(k.replace(/-/g, '')) * 100 + 80 + i,
      fromCal: true,
      streak: false,
    }))
    const base: Activity[] = [
      ...BASE_TEMPLATE,
      ...(k === '2026-03-28' ? TODAY_EXTRA : []),
    ].map((a, i) => ({
      ...a,
      id: parseInt(k.replace(/-/g, '')) * 100 + i,
    }))
    res[k] = [...base, ...gcal]
  }
  return res
}

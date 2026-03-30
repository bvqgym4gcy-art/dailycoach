import type { Activity, DayMealPlan } from '../types'
import { dateKey } from '../lib/utils'
import { WEEKLY_PLAN } from './diet'

interface GCalEvent {
  date: string
  time: string
  title: string
  category: Activity['category']
  duration: number
}

// ─── GOOGLE CALENDAR EVENTS (synced from stefanodc@adtucon.io) ──
// Last sync: 2026-03-30
// To update: re-fetch from Google Calendar API and replace this array
export const GCAL: GCalEvent[] = [
  // March 2026
  { date: '2026-03-28', time: '01:30', title: '✈ Going to Warsaw', category: 'sociale', duration: 60 },
  { date: '2026-03-30', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-03-30', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-03-30', time: '15:00', title: '💰 Soldi', category: 'lavoro', duration: 60 },
  { date: '2026-03-31', time: '20:00', title: '◎ Cena', category: 'sociale', duration: 90 },
  // April 2026
  { date: '2026-04-01', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-01', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan weekly', category: 'lavoro', duration: 50 },
  { date: '2026-04-03', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-06', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-06', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-07', time: '09:00', title: '⊕ Fisio Cassino 9', category: 'salute', duration: 60 },
  { date: '2026-04-08', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-08', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan weekly', category: 'lavoro', duration: 50 },
  { date: '2026-04-10', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-11', time: '10:00', title: '◎ Compleanno di Andrea — Roma', category: 'sociale', duration: 120 },
  { date: '2026-04-13', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-13', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-15', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-15', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan weekly', category: 'lavoro', duration: 50 },
  { date: '2026-04-17', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-20', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-20', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-22', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-22', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan weekly', category: 'lavoro', duration: 50 },
  { date: '2026-04-24', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-27', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-27', time: '11:30', title: '⬡ Weekly Update Adtucon-Visio', category: 'lavoro', duration: 45 },
  { date: '2026-04-29', time: '11:00', title: '⬡ Check the strategy', category: 'lavoro', duration: 15 },
  { date: '2026-04-29', time: '18:30', title: '⬡ Sal/Nello/Stefano/Brendan weekly', category: 'lavoro', duration: 50 },
]

// ─── PILLOLE ────────────────────────────────────────────────
const PILLS_BASE: Omit<Activity, 'id'>[] = [
  { time: '07:30', title: 'Pillola — NAC 1000mg a digiuno', category: 'salute', duration: 5, streak: true },
  { time: '08:30', title: 'Pillola — Collagene PRE-palestra', category: 'salute', duration: 5, streak: true },
  { time: '09:00', title: 'Pillola — Immunomix x2 + Psicobrain mattina', category: 'salute', duration: 5, streak: true },
  { time: '10:15', title: 'Pillola — Collagene POST-palestra', category: 'salute', duration: 5, streak: true },
  { time: '13:30', title: 'Pillola — Omega3+CoQ10 + Berberol pranzo', category: 'salute', duration: 5, streak: true },
  { time: '16:00', title: 'Pillola — Immunomix x2 + Psicobrain pomeriggio', category: 'salute', duration: 5, streak: true },
  { time: '20:00', title: 'Pillola — Omega3+CoQ10 + Berberol + D3+K2', category: 'salute', duration: 5, streak: true },
  { time: '22:30', title: 'Pillola — Protectin prima di dormire', category: 'salute', duration: 5, streak: true },
]

const PILLS_FASE3: Omit<Activity, 'id'>[] = [
  { time: '07:30', title: 'Pillola — NAC 1000mg a digiuno', category: 'salute', duration: 5, streak: true },
  { time: '08:00', title: '🥥 Olio di cocco — 1 cucchiaio (30min dopo NAC)', category: 'salute', duration: 5, streak: true },
  { time: '08:30', title: 'Pillola — Collagene PRE-palestra', category: 'salute', duration: 5, streak: true },
  { time: '09:00', title: 'Pillola — Immunomix x2 + Psicobrain mattina', category: 'salute', duration: 5, streak: true },
  { time: '10:15', title: 'Pillola — Collagene POST-palestra', category: 'salute', duration: 5, streak: true },
  { time: '13:30', title: 'Pillola — Omega3+CoQ10 + Berberol pranzo', category: 'salute', duration: 5, streak: true },
  { time: '16:00', title: 'Pillola — Immunomix x2 + Psicobrain pomeriggio', category: 'salute', duration: 5, streak: true },
  { time: '20:00', title: 'Pillola — Omega3+CoQ10 + Berberol + D3+K2', category: 'salute', duration: 5, streak: true },
  { time: '22:30', title: 'Pillola — Protectin prima di dormire', category: 'salute', duration: 5, streak: true },
]

// ─── SPORT ──────────────────────────────────────────────────
const SPORT: Omit<Activity, 'id'>[] = [
  { time: '09:00', title: 'Palestra', category: 'sport', duration: 60, streak: true },
]

const DIET_START = '2026-04-01'

const TODAY_EXTRA: Omit<Activity, 'id'>[] = [
  { time: '15:00', title: 'Piano pillole settimanale', category: 'lavoro', duration: 60, streak: false },
  { time: '16:30', title: 'Organizza aperitivo con Sabrina', category: 'sociale', duration: 20, streak: false },
  { time: '17:00', title: 'Organizza cena', category: 'sociale', duration: 20, streak: false },
  { time: '18:00', title: 'Newsletter — 1h focus', category: 'lavoro', duration: 60, streak: true },
]

export const HABIT_LIST = [...new Set(PILLS_FASE3.filter((a) => a.streak).map((a) => a.title))]

// ─── PASTI ──────────────────────────────────────────────────

function buildMeals(k: string, mealPlan?: DayMealPlan): Omit<Activity, 'id'>[] {
  const isDiet = k >= DIET_START
  const dayOfWeek = (new Date(k).getDay() + 6) % 7

  if (!isDiet) {
    return [
      { time: '08:00', title: '☕ Colazione', category: 'routine', duration: 20, streak: false },
      { time: '11:00', title: '🍎 Spuntino mattina', category: 'routine', duration: 10, streak: false },
      { time: '13:30', title: '🥗 Pranzo', category: 'routine', duration: 30, streak: false },
      { time: '16:30', title: '🍎 Spuntino pomeriggio', category: 'routine', duration: 10, streak: false },
      { time: '20:00', title: '🍽 Cena', category: 'routine', duration: 40, streak: false },
    ]
  }

  const fallback = WEEKLY_PLAN[dayOfWeek]
  const colazione = mealPlan?.colazione || '🔒 Digiuno — solo acqua, tè, caffè'
  const pranzo = mealPlan?.pranzo || `${fallback.pranzo.carb}, ${fallback.pranzo.protein}`
  const merenda = mealPlan?.merenda || fallback.merenda
  const cena = mealPlan?.cena || `${fallback.cena.protein}, ${fallback.cena.verdura}`

  const meals: Omit<Activity, 'id'>[] = [
    { time: '08:00', title: colazione.startsWith('🔒') ? colazione : `☕ Colazione — ${colazione}`, category: 'routine', duration: 10, streak: true },
    { time: '14:00', title: `🥗 Pranzo — ${pranzo}`, category: 'routine', duration: 40, streak: true },
    { time: '17:00', title: `🥣 Merenda — ${merenda}`, category: 'routine', duration: 10, streak: true },
    { time: '20:00', title: `🍽 Cena — ${cena}`, category: 'routine', duration: 40, streak: true },
  ]

  if (mealPlan?.spuntino1) {
    meals.push({ time: '11:00', title: `🍎 Spuntino — ${mealPlan.spuntino1}`, category: 'routine', duration: 10, streak: false })
  }
  if (mealPlan?.spuntino2) {
    meals.push({ time: '16:00', title: `🍎 Spuntino — ${mealPlan.spuntino2}`, category: 'routine', duration: 10, streak: false })
  }

  return meals
}

export function buildAll(
  saved: Record<string, Activity[]> = {},
  mealPlans: Record<string, DayMealPlan> = {}
): Record<string, Activity[]> {
  const res = { ...saved }
  const s = new Date('2026-03-28')
  const e = new Date('2026-04-30')
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const k = dateKey(new Date(d))

    // Build calendar events for this day
    const gcalEvents: Activity[] = GCAL.filter((ev) => ev.date === k).map((ev, i) => ({
      ...ev,
      id: parseInt(k.replace(/-/g, '')) * 100 + 80 + i,
      fromCal: true,
      streak: false,
    }))

    if (res[k]) {
      // Day already exists — sync calendar events (add missing, keep manual activities)
      const existingTitles = new Set(res[k].filter((a) => a.fromCal).map((a) => a.title))
      const newCalEvents = gcalEvents.filter((ev) => !existingTitles.has(ev.title))
      if (newCalEvents.length > 0) {
        res[k] = [...res[k], ...newCalEvents]
      }
      continue
    }

    // New day — build from scratch
    const meals = buildMeals(k, mealPlans[k])
    const isDiet = k >= DIET_START
    const pills = isDiet ? PILLS_FASE3 : PILLS_BASE

    const template: Omit<Activity, 'id'>[] = [
      ...pills,
      ...SPORT,
      ...meals,
      ...(k === '2026-03-28' ? TODAY_EXTRA : []),
    ]

    const base: Activity[] = template.map((a, i) => ({
      ...a,
      id: parseInt(k.replace(/-/g, '')) * 100 + i,
    }))

    res[k] = [...base, ...gcalEvents]
  }
  return res
}

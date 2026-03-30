import type { Activity, DayMealPlan, DailyCheckInData, SportType } from '../types'
import { dateKey } from '../lib/utils'
import { WEEKLY_PLAN } from './diet'

const SPORT_LABELS: Record<SportType, { icon: string; label: string; duration: number }> = {
  palestra: { icon: '🏋️', label: 'Palestra', duration: 60 },
  nuoto: { icon: '🏊', label: 'Nuoto', duration: 60 },
  corsa: { icon: '🏃', label: 'Corsa', duration: 45 },
  yoga: { icon: '🧘', label: 'Yoga', duration: 60 },
}

// Calendar events come ONLY from live Google Calendar sync (calendarSync.ts)
// No hardcoded events — single source of truth

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

function buildSport(checkIn?: DailyCheckInData): Omit<Activity, 'id'>[] {
  if (!checkIn || checkIn.sport === 'skip') return []
  const s = SPORT_LABELS[checkIn.sport]
  const time = checkIn.sportTime || '09:00'
  return [
    { time, title: `${s.icon} ${s.label}`, category: 'sport', duration: s.duration, streak: true },
  ]
}

const DIET_START = '2026-04-01'

export const HABIT_LIST = [...new Set(PILLS_FASE3.filter((a) => a.streak).map((a) => a.title))]

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

  if (mealPlan?.spuntino1) meals.push({ time: '11:00', title: `🍎 Spuntino — ${mealPlan.spuntino1}`, category: 'routine', duration: 10, streak: false })
  if (mealPlan?.spuntino2) meals.push({ time: '16:00', title: `🍎 Spuntino — ${mealPlan.spuntino2}`, category: 'routine', duration: 10, streak: false })

  return meals
}

export function buildAll(
  saved: Record<string, Activity[]> = {},
  mealPlans: Record<string, DayMealPlan> = {},
  dailyCheckIn: Record<string, DailyCheckInData> = {}
): Record<string, Activity[]> {
  const res = { ...saved }
  // Only generate 7 days back + 21 days forward = 28 days (not months)
  const now = new Date()
  const s = new Date(now); s.setDate(s.getDate() - 7)
  const e = new Date(now); e.setDate(e.getDate() + 21)
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const k = dateKey(new Date(d))

    if (res[k]) {
      // Day exists in saved data — clean up legacy issues
      let dayActs = res[k]

      // Remove legacy sport if no check-in for this day
      if (!dailyCheckIn[k]) {
        dayActs = dayActs.filter((a) => a.category !== 'sport')
      }

      // Remove Collagene PRE/POST if no sport for this day
      if (!dailyCheckIn[k] || dailyCheckIn[k].sport === 'skip') {
        dayActs = dayActs.filter((a) => {
          const lower = a.title.toLowerCase()
          return !lower.includes('collagene pre') && !lower.includes('collagene post')
        })
      }

      res[k] = dayActs
      continue
    }

    // New day — build from template (no calendar events here, those come from live sync)
    const meals = buildMeals(k, mealPlans[k])
    const isDiet = k >= DIET_START
    const pills = isDiet ? PILLS_FASE3 : PILLS_BASE
    const sport = buildSport(dailyCheckIn[k])

    const base: Activity[] = [...pills, ...sport, ...meals].map((a, i) => ({
      ...a,
      id: parseInt(k.replace(/-/g, '')) * 100 + i,
    }))

    res[k] = base
  }
  return res
}

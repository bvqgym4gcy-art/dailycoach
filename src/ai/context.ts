import type { Activity, HistoryEntry, JournalEntry, DailyCheckInData, ActiveProtocol, ScheduleRule, DayMealPlan } from '../types'
import { dateKey, addDays } from '../lib/utils'
import { PROTOCOLS } from '../data/protocols'
import { WEEKLY_PLAN, DAY_NAMES, DIET_RULES } from '../data/diet'

export function buildContext(
  ck: string,
  dayActs: Activity[],
  dayChecks: Record<number, boolean>,
  checks: Record<string, Record<number, boolean>>,
  allActs: Record<string, Activity[]>,
  history: Record<string, HistoryEntry>,
  moods: Record<string, number>,
  journal: Record<string, JournalEntry>,
  activeProtocol?: ActiveProtocol | null,
  dailyCheckIn?: Record<string, DailyCheckInData>,
  rules?: ScheduleRule[],
  notes?: Record<string, string>,
  mealPlans?: Record<string, DayMealPlan>
): string {
  const today = dateKey(new Date())
  const now = new Date()
  const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const tomorrow = dateKey(addDays(new Date(), 1))
  const dayOfWeek = (now.getDay() + 6) % 7

  // ── TODAY'S ACTIVITIES ──
  const todayActs = [...(allActs[today] || [])].sort((a, b) => a.time.localeCompare(b.time))
  const todayChecks = checks[today] || {}
  const done = todayActs.filter((a) => todayChecks[a.id]).length
  const total = todayActs.length
  const rate = total ? Math.round((done / total) * 100) : 0

  const summary = todayActs
    .map((a) => {
      const status = todayChecks[a.id] ? '✅' : '⬜'
      const noteKey = `${today}_${a.id}`
      const note = notes?.[noteKey] ? ` [nota: "${notes[noteKey]}"]` : ''
      const cal = a.fromCal ? ' [CAL]' : ''
      return `ID:${a.id} | ${a.time} ${a.title} — ${status}${cal}${note}`
    })
    .join('\n')

  // ── NEXT 7 DAYS PREVIEW ──
  const weekPreview = Array.from({ length: 7 }, (_, i) => {
    const d = dateKey(addDays(new Date(), i + 1))
    const acts = (allActs[d] || []).filter((a) => a.fromCal)
    const dayName = DAY_NAMES[(dayOfWeek + i + 1) % 7]
    if (acts.length === 0) return `${d} (${dayName}): nessun evento`
    return `${d} (${dayName}): ${acts.map((a) => `${a.time} ${a.title}`).join(', ')}`
  }).join('\n')

  // ── HISTORY 14 DAYS ──
  const hist = Object.entries(history)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([d, v]) => `${d}: ${v.rate}% (${v.completed}/${v.total})`)
    .join('\n')

  // ── MOST SKIPPED ──
  const skipCounts: Record<string, number> = {}
  Object.entries(checks).forEach(([d, chk]) => {
    ;(allActs[d] || []).filter((a) => !chk[a.id]).forEach((a) => { skipCounts[a.title] = (skipCounts[a.title] || 0) + 1 })
  })
  const mostSkipped = Object.entries(skipCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => `"${t}": ${n}x`).join(', ')

  // ── MOODS ──
  const moodStr = Object.entries(moods).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([d, v]) => `${d}: ${v}/5`).join(', ')

  // ── JOURNAL ──
  const journalStr = Object.entries(journal).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7).map(([d, v]) => `${d}: "${v.text}"`).join('\n')

  // ── SPORT HISTORY ──
  const sportHistory = Object.entries(dailyCheckIn || {})
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([d, ci]) => `${d}: ${ci.sport === 'skip' ? 'riposo' : `${ci.sport} alle ${ci.sportTime}`}`)
    .join(', ')

  // ── ACTIVE PROTOCOL ──
  let protocolStr = 'Nessuno'
  if (activeProtocol) {
    const p = PROTOCOLS.find((x) => x.id === activeProtocol.protocolId)
    if (p) {
      const dayNum = Math.floor((now.getTime() - new Date(activeProtocol.startDate).getTime()) / 86400000) + 1
      const todayLog = activeProtocol.dailyLog[today] || {}
      const todayDone = Object.values(todayLog).filter(Boolean).length
      const ruleStatus = p.rules.map((r) => `${todayLog[r.id] ? '✅' : '⬜'} ${r.label}`).join(', ')
      protocolStr = `${p.icon} ${p.name} giorno ${dayNum}/${p.durationDays} — oggi ${todayDone}/${p.rules.length}: ${ruleStatus}`
    }
  }
  const availableProtocols = PROTOCOLS.map((p) => `${p.icon} ${p.name} (${p.durationDays}gg): ${p.description}`).join('\n')

  // ── DIET ──
  const todayMealPlan = mealPlans?.[today]
  const todayPlanStr = todayMealPlan
    ? `Colazione: ${todayMealPlan.colazione || '-'}, Pranzo: ${todayMealPlan.pranzo || '-'}, Merenda: ${todayMealPlan.merenda || '-'}, Cena: ${todayMealPlan.cena || '-'}`
    : (() => {
        const wp = WEEKLY_PLAN[dayOfWeek]
        return `Piano ${DAY_NAMES[dayOfWeek]}: Pranzo: ${wp.pranzo.carb} + ${wp.pranzo.protein} + ${wp.pranzo.verdura} + Olio EVO 20g | Merenda: ${wp.merenda} | Cena: Pane 3 fette 90g + ${wp.cena.protein} + ${wp.cena.verdura} + Olio EVO 15g`
      })()

  // ── SMART RULES ──
  const allRules = (rules || []).map((r) => `${r.anchor} → ${r.dependent}: +${r.offsetMin}min (${r.trigger}, confermato ${r.learned}x)`).join('\n')

  return `Sei Sally, l'assistente personale di Stefano. Conosci TUTTO della sua vita nell'app.

REGOLE:
- Italiano, breve e diretto (2-3 frasi + azione)
- OGGI = ${today}, ORA = ${timeNow}, DOMANI = ${tomorrow}
- USA SEMPRE I TOOL per eseguire azioni. Mai dire "non posso" o "fallo manualmente"
- Per più azioni, chiama ogni tool separatamente
- Per giorni diversi da oggi, usa get_day prima di rispondere
- Conferma brevemente dopo ogni azione

═══ OGGI ${today} — ${rate}% (${done}/${total}) ═══
${summary}

═══ PROSSIMI 7 GIORNI ═══
${weekPreview}

═══ SPORT ═══
Oggi: ${dailyCheckIn?.[today] ? (dailyCheckIn[today].sport === 'skip' ? 'riposo' : `${dailyCheckIn[today].sport} alle ${dailyCheckIn[today].sportTime}`) : 'non scelto'}
Storico: ${sportHistory || '-'}

═══ PROTOCOLLO ═══
Attivo: ${protocolStr}
Disponibili: ${availableProtocols}

═══ DIETA (Fase 3 IF 16:8, 14:00-22:00) ═══
Piano oggi: ${todayPlanStr}
Regole: ${DIET_RULES.notes.join(' | ')}

═══ STORICO 14GG ═══
${hist || '-'}
Più saltate: ${mostSkipped || '-'}

═══ UMORE 7GG ═══
${moodStr || '-'}

═══ JOURNAL ═══
${journalStr || '-'}

═══ REGOLE SMART ═══
${allRules || 'Nessuna regola personalizzata'}

TOOL: toggle_activity, add_activity(+date!), delete_activity, move_activity, save_note, save_journal, set_meal_plan, get_day`
}

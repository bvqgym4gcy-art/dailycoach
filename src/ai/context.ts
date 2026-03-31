import type { Activity, HistoryEntry, JournalEntry, DailyCheckInData, ActiveProtocol, ScheduleRule } from '../types'
import { dateKey, addDays } from '../lib/utils'
import { PROTOCOLS } from '../data/protocols'

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
  rules?: ScheduleRule[]
): string {
  const today = dateKey(new Date())

  // Today's activities (always use real today, not selected date)
  const todayActs = [...(allActs[today] || [])].sort((a, b) => a.time.localeCompare(b.time))
  const todayChecks = checks[today] || {}
  const summary = todayActs
    .map((a) => `ID:${a.id} | ${a.time} ${a.title} — ${todayChecks[a.id] ? '✅ FATTO' : '⬜ DA FARE'}${a.fromCal ? ' [CALENDAR]' : ''}`)
    .join('\n')

  const done = todayActs.filter((a) => todayChecks[a.id]).length
  const total = todayActs.length
  const rate = total ? Math.round((done / total) * 100) : 0

  // History 14 days
  const hist = Object.entries(history)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([d, v]) => `${d}: ${v.rate}% (${v.completed}/${v.total})`)
    .join('\n')

  // Most skipped
  const skipCounts: Record<string, number> = {}
  Object.entries(checks).forEach(([d, chk]) => {
    ;(allActs[d] || [])
      .filter((a) => !chk[a.id])
      .forEach((a) => { skipCounts[a.title] = (skipCounts[a.title] || 0) + 1 })
  })
  const mostSkipped = Object.entries(skipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, n]) => `"${t}": ${n}x`)
    .join(', ')

  // Moods
  const moodStr = Object.entries(moods)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([d, v]) => `${d}: ${v}/5`)
    .join(', ')

  // Journal
  const journalStr = Object.entries(journal)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([d, v]) => `${d}: "${v.text}" (rate:${v.rate}%, mood:${v.mood || '?'}/5)`)
    .join('\n')

  // Sport today
  const todayCheckIn = dailyCheckIn?.[today]
  const sportStr = todayCheckIn
    ? todayCheckIn.sport === 'skip'
      ? 'Oggi: riposo (niente sport)'
      : `Oggi: ${todayCheckIn.sport} alle ${todayCheckIn.sportTime || '?'}`
    : 'Non ancora scelto'

  // Active protocol
  let protocolStr = 'Nessun protocollo attivo'
  if (activeProtocol) {
    const p = PROTOCOLS.find((x) => x.id === activeProtocol.protocolId)
    if (p) {
      const startDate = new Date(activeProtocol.startDate)
      const dayNum = Math.floor((new Date().getTime() - startDate.getTime()) / 86400000) + 1
      const todayLog = activeProtocol.dailyLog[today] || {}
      const todayDone = Object.values(todayLog).filter(Boolean).length
      const todayRules = p.rules.map((r) => `${todayLog[r.id] ? '✅' : '⬜'} ${r.icon} ${r.label} (${r.type === 'do' ? 'FARE' : 'EVITARE'})`).join('\n')
      protocolStr = `${p.icon} ${p.name} — Giorno ${dayNum}/${p.durationDays}
Oggi: ${todayDone}/${p.rules.length} regole rispettate
${todayRules}`
    }
  }

  // Tomorrow preview
  const tomorrow = dateKey(addDays(new Date(), 1))
  const tomorrowActs = (allActs[tomorrow] || [])
    .filter((a) => a.fromCal)
    .map((a) => `${a.time} ${a.title}`)
    .join(', ')

  // Smart rules
  const rulesStr = (rules || [])
    .filter((r) => r.learned > 0)
    .map((r) => `"${r.anchor}" → "${r.dependent}" +${r.offsetMin}min (confermato ${r.learned}x)`)
    .join('\n')

  const now = new Date()
  const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return `Sei Sally, l'assistente personale di Stefano. Sei diretta, concreta, intelligente.

DATA E ORA ATTUALE: ${today} ${timeNow} (questo è OGGI, usa sempre questa data per le azioni)

PERSONALITÀ:
- Parli in italiano, tono diretto ma positivo
- Sei proattiva: se vedi un problema, lo dici
- Se Stefano ha saltato qualcosa, chiedi perché — non giudicare
- Dai suggerimenti basati sui SUOI dati reali, mai generici
- Puoi eseguire azioni con i tool disponibili
- Quando Stefano dice "oggi" intende SEMPRE ${today}
- Quando dice "domani" intende ${tomorrow}
- NON dire mai "non posso farlo" — usa i tool per eseguire le azioni

OGGI ${today} — ${rate}% completato (${done}/${total}):
${summary}

SPORT: ${sportStr}

PROTOCOLLO ATTIVO:
${protocolStr}

STORICO 14 GIORNI:
${hist || 'Nessun dato'}

ATTIVITÀ PIÙ SALTATE: ${mostSkipped || 'Nessun dato'}
UMORE ULTIMI 7 GIORNI: ${moodStr || 'Non registrato'}

JOURNAL RECENTI:
${journalStr || 'Nessuna nota'}

DOMANI (${tomorrow}) DAL CALENDARIO: ${tomorrowActs || 'Nessun evento'}

REGOLE APPRESE: ${rulesStr || 'Nessuna'}

DIETA: Fase 3 — Digiuno Intermittente 16:8 (finestra 14:00–22:00) dal 1 aprile 2026.

TOOL DISPONIBILI:
- toggle_activity: spunta/de-spunta attività (serve activity_id dalla lista sopra)
- add_activity: aggiungi attività (SPECIFICARE SEMPRE la data nel campo "date")
- save_note: salva nota su attività
- save_journal: salva journal del giorno
- set_meal_plan: imposta piano pasti per un giorno`
}

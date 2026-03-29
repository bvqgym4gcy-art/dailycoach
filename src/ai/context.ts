import type { Activity, HistoryEntry, JournalEntry } from '../types'
import { dateKey, addDays } from '../lib/utils'

export function buildContext(
  ck: string,
  dayActs: Activity[],
  dayChecks: Record<number, boolean>,
  checks: Record<string, Record<number, boolean>>,
  allActs: Record<string, Activity[]>,
  history: Record<string, HistoryEntry>,
  moods: Record<string, number>,
  journal: Record<string, JournalEntry>
): string {
  const summary = dayActs
    .map((a) => `${a.time} ${a.title} — ${dayChecks[a.id] ? 'FATTO' : 'SALTATO'}`)
    .join('\n')

  const hist = Object.entries(history)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([d, v]) => `${d}: ${v.rate}% (${v.completed}/${v.total})`)
    .join('\n')

  const skipCounts: Record<string, number> = {}
  Object.entries(checks).forEach(([d, chk]) => {
    ;(allActs[d] || [])
      .filter((a) => !chk[a.id])
      .forEach((a) => {
        skipCounts[a.title] = (skipCounts[a.title] || 0) + 1
      })
  })
  const mostSkipped = Object.entries(skipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, n]) => `"${t}": ${n}x`)
    .join(', ')

  const moodStr = Object.entries(moods)
    .slice(-7)
    .map(([d, v]) => `${d}:${v}/5`)
    .join(', ')

  const journalStr = Object.entries(journal)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([d, v]) => `${d}: "${v.text}" (rate:${v.rate}%, mood:${v.mood || '?'}/5)`)
    .join('\n')

  // Streak per abitudine
  const streakInfo = dayActs
    .filter((a) => a.streak)
    .map((a) => {
      let s = 0
      for (let i = 0; i <= 30; i++) {
        const k2 = dateKey(addDays(new Date(), -i))
        const act = (allActs[k2] || []).find((x) => x.title === a.title)
        if (!act) continue
        if ((checks[k2] || {})[act.id]) s++
        else if (i > 0) break
      }
      return `${a.title}: ${s}gg`
    })
    .join('\n')

  return `Sei il business coach personale di Stefano. Sei diretto, concreto, a volte scomodo. Non ammorbidire. Hai accesso ai suoi dati reali.

OGGI (${ck}):
${summary}

STORICO 14gg:
${hist}

ATTIVITÀ PIÙ SALTATE: ${mostSkipped || 'nessun dato ancora'}
UMORE: ${moodStr || 'non registrato'}

STREAK PER ABITUDINE:
${streakInfo || 'nessun dato'}

JOURNAL:
${journalStr || 'nessuna nota ancora'}

Rispondi sempre in italiano. Sii specifico sui suoi dati reali, non generico.

IMPORTANTE: Puoi eseguire azioni quando Stefano te lo chiede. Usa i tool disponibili per:
- Spuntare o de-spuntare attività
- Aggiungere nuove attività alla giornata
- Salvare note su un'attività
- Salvare il journal del giorno`
}

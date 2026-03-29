import type { Activity, HistoryEntry } from '../types'
import { dateKey, todayKey, addDays } from '../lib/utils'
import { MOODS } from '../config'
import { HABIT_LIST } from '../data/activities'

interface Props {
  rate: number
  done: number
  total: number
  streak: number
  history: Record<string, HistoryEntry>
  moods: Record<string, number>
  allActs: Record<string, Activity[]>
  checks: Record<string, Record<number, boolean>>
}

export function StatsTab({ rate, done, total, streak, history, moods, allActs, checks }: Props) {
  const avg7 = (() => {
    const l = Object.values(history).slice(-7)
    return l.length ? `${Math.round(l.reduce((s, v) => s + v.rate, 0) / l.length)}%` : '—'
  })()

  const cards = [
    { l: 'Oggi', v: `${rate}%`, s: `${done}/${total}` },
    { l: 'Streak', v: `${streak}gg`, s: 'consecutivi' },
    { l: 'Media 7gg', v: avg7, s: 'completion' },
    { l: 'Saltate', v: String(total - done), s: 'oggi' },
  ]

  function hStreak(title: string): number {
    let s = 0
    for (let i = 0; i <= 30; i++) {
      const k2 = dateKey(addDays(new Date(), -i))
      const act = (allActs[k2] || []).find((a) => a.title === title)
      if (!act) continue
      if ((checks[k2] || {})[act.id]) s++
      else if (i > 0) break
    }
    return s
  }

  return (
    <div className="pt-3.5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {cards.map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-[10px] text-muted-3 mb-[3px]">{k.l}</div>
            <div className="text-2xl font-bold">{k.v}</div>
            <div className="text-[10px] text-muted-4">{k.s}</div>
          </div>
        ))}
      </div>

      {/* 14 day chart */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-3">
        <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">14 giorni</span>
        <div className="flex items-end gap-[3px] h-[60px]">
          {Array.from({ length: 14 }, (_, i) => {
            const d = addDays(new Date(), -(13 - i))
            const k = dateKey(d)
            const r = history[k]?.rate || 0
            const isT = k === todayKey()
            const mood = moods[k]
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-px">
                {mood && <div className="text-[7px] leading-none">{MOODS.find((m) => m.v === mood)?.e}</div>}
                <div
                  className="w-full rounded-sm"
                  style={{
                    background: isT ? '#fff' : r >= 80 ? '#777' : r >= 30 ? '#2a2a2a' : '#141414',
                    height: `${Math.max(r, 3)}%`,
                    minHeight: 3,
                  }}
                />
                {i % 3 === 0 && <div className="text-[7px] text-muted-5">{d.getDate()}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Habit streaks */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-3">
        <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">Streak abitudini</span>
        {HABIT_LIST.map((title) => {
          const s = hStreak(title)
          return (
            <div key={title} className="mb-3">
              <div className="flex justify-between mb-1">
                <div className="text-[11px] text-[#777]">{title.replace(/Pillola — /, '')}</div>
                <div className="text-[11px] font-bold">🔥{s}</div>
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 7 }, (_, i) => {
                  const k2 = dateKey(addDays(new Date(), -(6 - i)))
                  const act = (allActs[k2] || []).find((a) => a.title === title)
                  const dd = act && (checks[k2] || {})[act.id]
                  const isT2 = k2 === todayKey()
                  return (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-sm"
                      style={{
                        background: dd ? '#fff' : isT2 ? '#1f1f1f' : '#111',
                        border: `1px solid ${isT2 ? '#2a2a2a' : 'transparent'}`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mood 7 days */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">Umore 7 giorni</span>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(new Date(), -(6 - i))
            const k = dateKey(d)
            const mood = moods[k]
            const isT = k === todayKey()
            return (
              <div key={i} className="flex-1 text-center">
                <div className="text-lg" style={{ opacity: mood ? 1 : 0.1 }}>
                  {mood ? MOODS.find((m) => m.v === mood)?.e : '😐'}
                </div>
                <div className={`text-[8px] mt-[3px] ${isT ? 'text-white' : 'text-muted-5'}`}>
                  {d.toLocaleDateString('it-IT', { weekday: 'narrow' })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

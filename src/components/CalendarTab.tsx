import type { Activity, HistoryEntry } from '../types'
import { dateKey, todayKey, fmtMonth, calcBest, calcStreak } from '../lib/utils'
import { calDays } from '../lib/utils'

interface Props {
  calMonth: Date
  setCalMonth: (fn: (m: Date) => Date) => void
  ck: string
  history: Record<string, HistoryEntry>
  streak: number
  allActs: Record<string, Activity[]>
  checks: Record<string, Record<number, boolean>>
  onSelectDate: (d: Date) => void
}

export function CalendarTab({ calMonth, setCalMonth, ck, history, streak, allActs, checks, onSelectDate }: Props) {
  const last30 = Object.keys(history).filter((k) => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return k >= dateKey(d)
  })
  const totalDone30 = last30.reduce((s, k) => s + (history[k]?.completed || 0), 0)
  const rates30 = last30.map((k) => history[k]?.rate || 0)
  const avgRate30 = rates30.length ? Math.round(rates30.reduce((a, b) => a + b, 0) / rates30.length) : 0

  const records = [
    { i: '🔥', v: String(streak), l: 'CURRENT STREAK' },
    { i: '🏅', v: String(calcBest(allActs, checks)), l: 'BEST STREAK' },
    { i: '✓', v: String(totalDone30), l: 'COMPLETED' },
    { i: '⚑', v: `${avgRate30}%`, l: 'SUCCESS RATE' },
  ]

  return (
    <div className="pt-3.5">
      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-3">
        <div className="flex justify-between items-center mb-3.5">
          <div className="text-base font-bold">{fmtMonth(calMonth)}</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCalMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d })}
              className="bg-border border border-input-border rounded-lg w-[30px] h-[30px] text-white text-[15px] cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={() => setCalMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d })}
              className="bg-border border border-input-border rounded-lg w-[30px] h-[30px] text-white text-[15px] cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-3 font-semibold py-[3px]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[3px]">
          {calDays(calMonth).map((d, i) => {
            if (!d) return <div key={i} />
            const k = dateKey(d)
            const v = history[k]
            const r = v?.rate || 0
            const isT = k === todayKey()
            const isSel = k === ck
            return (
              <button
                key={i}
                onClick={() => onSelectDate(new Date(d))}
                className="aspect-square rounded-[9px] flex items-center justify-center flex-col cursor-pointer"
                style={{
                  border: `1px solid ${isSel ? '#fff' : isT ? '#333' : '#0f0f0f'}`,
                  background: isSel ? '#fff' : r >= 80 ? '#1a1a1a' : r >= 1 ? '#111' : '#080808',
                }}
              >
                <span
                  className={`text-xs ${isT ? 'font-bold' : 'font-normal'}`}
                  style={{ color: isSel ? '#000' : isT ? '#fff' : '#444' }}
                >
                  {d.getDate()}
                </span>
                {r > 0 && (
                  <div
                    className="w-[3px] h-[3px] rounded-full mt-px"
                    style={{ background: isSel ? '#000' : '#fff' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Records */}
      <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2.5 block">
        Records — 30 giorni
      </span>
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-5">
          {records.map(({ i, v, l }) => (
            <div key={l} className="text-center">
              <div className="text-2xl mb-[3px]">{i}</div>
              <div className="text-[26px] font-bold">{v}</div>
              <div className="text-[9px] text-muted-3 tracking-widest mt-[3px]">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import type { Activity, JournalEntry } from '../types'
import { fmtLong, nowHHMM, todayKey } from '../lib/utils'

interface Props {
  curDate: Date
  setCurDate: (d: Date) => void
  dayActs: Activity[]
  dayChecks: Record<number, boolean>
  done: number
  total: number
  rate: number
  isToday: boolean
  ck: string
  notes: Record<string, string>
  journal: Record<string, JournalEntry>
  onToggle: (id: number) => void
  onNote: (act: Activity) => void
  onEdit: (act: Activity) => void
  onDelete: (id: number) => void
  onAdd: () => void
  onJournal: () => void
}

export function HabitsTab({
  curDate, setCurDate, dayActs, dayChecks, done, total, rate, isToday, ck, notes, journal,
  onToggle, onNote, onEdit, onDelete, onAdd, onJournal,
}: Props) {
  const nowIdx = isToday
    ? (() => {
        const t = nowHHMM()
        let j = -1
        for (let i = dayActs.length - 1; i >= 0; i--) {
          if (dayActs[i].time <= t) { j = i; break }
        }
        return j
      })()
    : -1

  return (
    <div className="pt-3.5">
      {/* Day header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="text-xs text-muted-1 capitalize">{fmtLong(curDate)}</div>
          <div className="text-[11px] text-muted-4 mt-px">
            {done}/{total} completate · {rate}%{!isToday ? ' · sola lettura' : ''}
          </div>
        </div>
        <button
          onClick={() => setCurDate(new Date())}
          className="text-[10px] text-muted-3 bg-card border border-border px-2 py-[3px] rounded-[7px] cursor-pointer"
        >
          Oggi
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-input-bg rounded-sm mb-3.5 overflow-hidden">
        <div className="h-full bg-white transition-all duration-500" style={{ width: `${rate}%` }} />
      </div>

      {/* Empty state */}
      {dayActs.length === 0 && (
        <div className="text-center py-12 text-muted-5 text-[13px]">Nessuna attività</div>
      )}

      {/* Activity list */}
      {dayActs.map((act, idx) => {
        const isDone = !!dayChecks[act.id]
        const isCur = idx === nowIdx
        const hasNote = !!notes[`${ck}_${act.id}`]

        return (
          <div
            key={act.id}
            className="rounded-[13px] mb-[7px] relative"
            style={{
              border: `1px solid ${isDone ? '#1e1e1e' : isCur ? '#fff' : '#141414'}`,
              background: isDone ? '#060606' : isCur ? '#0f0f0f' : '#0a0a0a',
            }}
          >
            {isCur && !isDone && (
              <div className="absolute -top-2 left-3 bg-white text-black text-[9px] font-bold px-[7px] py-[2px] rounded-[20px]">
                ▶ ORA
              </div>
            )}
            <div className="flex items-center gap-2.5 py-[11px] px-3">
              <button
                onClick={() => onToggle(act.id)}
                className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] text-black"
                style={{
                  border: `1.5px solid ${isDone ? '#fff' : isCur ? '#555' : '#1f1f1f'}`,
                  background: isDone ? '#fff' : 'transparent',
                  cursor: !isToday ? 'not-allowed' : 'pointer',
                  opacity: !isToday ? 0.3 : 1,
                }}
              >
                {isDone ? '✓' : ''}
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[13px] font-medium mb-0.5 ${isDone ? 'text-[#252525] line-through' : 'text-[#e0e0e0]'}`}
                >
                  {act.title}
                </div>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <span className="text-[10px] text-muted-3">⏱{act.time}</span>
                  <span className="text-[10px] text-muted-5">·</span>
                  <span className="text-[10px] text-muted-3">{act.duration}min</span>
                  <span className="text-[9px] text-muted-4 border border-border px-[5px] py-px rounded-[5px]">
                    {act.category}
                  </span>
                  {act.streak && <span className="text-[9px] text-muted-3">🔥</span>}
                  {act.fromCal && (
                    <span className="text-[9px] text-muted-4 border border-border px-1 py-px rounded-[5px]">
                      cal
                    </span>
                  )}
                  {hasNote && <span className="text-[10px] text-muted-1">✎</span>}
                </div>
              </div>
              <div className="flex gap-px">
                <button onClick={() => onNote(act)} className={`p-[5px] text-[13px] bg-transparent border-none cursor-pointer ${hasNote ? 'text-[#aaa]' : 'text-muted-5'}`}>✎</button>
                <button onClick={() => onEdit(act)} className="p-[5px] text-[11px] text-muted-5 bg-transparent border-none cursor-pointer">⚙</button>
                <button onClick={() => onDelete(act.id)} className="p-[5px] text-[11px] text-[#1e1e1e] bg-transparent border-none cursor-pointer">✕</button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Add button */}
      {isToday && (
        <button
          onClick={onAdd}
          className="w-full p-3 mt-0.5 border border-dashed border-border rounded-[13px] text-muted-5 text-xs bg-transparent cursor-pointer"
        >
          + Aggiungi attività
        </button>
      )}

      {/* Journal section */}
      {isToday && (
        <div className="bg-card border border-border rounded-2xl p-4 mt-2">
          <div className="flex justify-between items-center" style={{ marginBottom: journal[ck] ? 8 : 0 }}>
            <div className="text-xs font-semibold text-muted-1">📓 Journal di oggi</div>
            <button
              onClick={onJournal}
              className="text-[11px] text-white bg-border border border-input-border px-2.5 py-1 rounded-lg cursor-pointer"
            >
              {journal[ck] ? 'Modifica' : '+ Scrivi'}
            </button>
          </div>
          {journal[ck] && (
            <div className="text-[13px] text-[#888] leading-relaxed italic">
              "{journal[ck].text}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

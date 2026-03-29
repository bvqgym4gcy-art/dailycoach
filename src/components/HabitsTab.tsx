import { useRef, useState, useCallback } from 'react'
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
  onEdit: (act: Activity) => void
  onAdd: () => void
  onJournal: () => void
  onReorder: (fromIdx: number, toIdx: number) => void
  onGoToCalendar: () => void
}

export function HabitsTab({
  curDate, setCurDate, dayActs, dayChecks, done, total, rate, isToday, ck, notes, journal,
  onToggle, onEdit, onAdd, onJournal, onReorder, onGoToCalendar,
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

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragStartY = useRef(0)
  const dragCurrentIdx = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)
  const itemHeights = useRef<number[]>([])

  const handleDragStart = useCallback((idx: number, e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    dragStartY.current = touch.clientY
    dragCurrentIdx.current = idx
    setDragIdx(idx)
    setDragOverIdx(idx)

    // Measure item heights
    if (listRef.current) {
      itemHeights.current = Array.from(listRef.current.children).map(
        (el) => (el as HTMLElement).getBoundingClientRect().height + 7 // 7px = margin-bottom
      )
    }
  }, [])

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (dragIdx === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const delta = touch.clientY - dragStartY.current

    // Calculate which position we're over
    let accumulated = 0
    let targetIdx = dragIdx
    if (delta > 0) {
      // Moving down
      for (let i = dragIdx; i < dayActs.length - 1; i++) {
        accumulated += itemHeights.current[i] || 55
        if (delta > accumulated - (itemHeights.current[i + 1] || 55) / 2) {
          targetIdx = i + 1
        } else break
      }
    } else {
      // Moving up
      for (let i = dragIdx; i > 0; i--) {
        accumulated -= itemHeights.current[i - 1] || 55
        if (delta < accumulated + (itemHeights.current[i - 1] || 55) / 2) {
          targetIdx = i - 1
        } else break
      }
    }
    setDragOverIdx(targetIdx)
  }, [dragIdx, dayActs.length])

  const handleDragEnd = useCallback(() => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      onReorder(dragIdx, dragOverIdx)
    }
    setDragIdx(null)
    setDragOverIdx(null)
  }, [dragIdx, dragOverIdx, onReorder])

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
      <div ref={listRef}>
        {dayActs.map((act, idx) => {
          const isDone = !!dayChecks[act.id]
          const isCur = idx === nowIdx
          const hasNote = !!notes[`${ck}_${act.id}`]
          const isDragging = dragIdx === idx
          const isDropTarget = dragOverIdx === idx && dragIdx !== null && dragIdx !== idx

          return (
            <div
              key={act.id}
              className="rounded-[13px] mb-[7px] relative transition-transform duration-150"
              style={{
                border: `1px solid ${isDropTarget ? '#fff' : isDone ? '#1e1e1e' : isCur ? '#fff' : '#141414'}`,
                background: isDragging ? '#151515' : isDone ? '#060606' : isCur ? '#0f0f0f' : '#0a0a0a',
                opacity: isDragging ? 0.6 : 1,
                transform: isDropTarget ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {isCur && !isDone && (
                <div className="absolute -top-2 left-3 bg-white text-black text-[9px] font-bold px-[7px] py-[2px] rounded-[20px]">
                  ▶ ORA
                </div>
              )}
              <div className="flex items-center gap-2 py-[11px] px-3">
                {/* Drag handle */}
                {isToday && (
                  <div
                    className="shrink-0 flex items-center justify-center w-5 h-8 cursor-grab text-muted-5 text-[11px] select-none touch-none"
                    onTouchStart={(e) => handleDragStart(idx, e)}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                  >
                    ⋮⋮
                  </div>
                )}

                {/* Check button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(act.id) }}
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

                {/* Task content — tap to edit (or go to calendar if fromCal) */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => act.fromCal ? onGoToCalendar() : onEdit(act)}
                >
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
                      <span className="text-[9px] text-white bg-[#1a1a1a] border border-[#333] px-1.5 py-px rounded-[5px]">
                        da Calendar →
                      </span>
                    )}
                    {hasNote && <span className="text-[10px] text-muted-1">✎</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

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

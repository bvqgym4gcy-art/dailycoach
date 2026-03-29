import { useRef, useState, useCallback } from 'react'
import type { Activity, JournalEntry, HistoryEntry } from '../types'
import { fmtLong, nowHHMM, todayKey, dateKey, addDays } from '../lib/utils'
import { detectTaskTag } from '../lib/taskType'

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
  history: Record<string, HistoryEntry>
  onToggle: (id: number) => void
  onEdit: (act: Activity) => void
  onAdd: () => void
  onJournal: () => void
  onReorder: (fromIdx: number, toIdx: number) => void
}

const SECTIONS = [
  { label: 'Mattina', from: '00:00', to: '12:00', icon: '☀️' },
  { label: 'Pomeriggio', from: '12:00', to: '18:00', icon: '🌤' },
  { label: 'Sera', from: '18:00', to: '23:59', icon: '🌙' },
]

export function HabitsTab({
  curDate, setCurDate, dayActs, dayChecks, done, total, rate, isToday, ck, notes, journal, history,
  onToggle, onEdit, onAdd, onJournal, onReorder,
}: Props) {
  const now = nowHHMM()

  // Find next undone activity
  const nextAct = isToday
    ? dayActs.find((a) => a.time >= now && !dayChecks[a.id])
    : null

  // Yesterday stats for morning briefing
  const yesterdayKey = dateKey(addDays(new Date(), -1))
  const yesterdayStats = history[yesterdayKey]

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragStartY = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)
  const itemHeights = useRef<number[]>([])

  // Swipe-to-complete state
  const [swipeId, setSwipeId] = useState<number | null>(null)
  const [swipeX, setSwipeX] = useState(0)
  const swipeStartX = useRef(0)

  const handleDragStart = useCallback((idx: number, e: React.TouchEvent) => {
    e.stopPropagation()
    dragStartY.current = e.touches[0].clientY
    setDragIdx(idx)
    setDragOverIdx(idx)
    if (listRef.current) {
      itemHeights.current = Array.from(listRef.current.children).map(
        (el) => (el as HTMLElement).getBoundingClientRect().height + 7
      )
    }
  }, [])

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (dragIdx === null) return
    e.preventDefault()
    const delta = e.touches[0].clientY - dragStartY.current
    let targetIdx = dragIdx
    let acc = 0
    if (delta > 0) {
      for (let i = dragIdx; i < dayActs.length - 1; i++) {
        acc += itemHeights.current[i] || 55
        if (delta > acc - (itemHeights.current[i + 1] || 55) / 2) targetIdx = i + 1
        else break
      }
    } else {
      for (let i = dragIdx; i > 0; i--) {
        acc -= itemHeights.current[i - 1] || 55
        if (delta < acc + (itemHeights.current[i - 1] || 55) / 2) targetIdx = i - 1
        else break
      }
    }
    setDragOverIdx(targetIdx)
  }, [dragIdx, dayActs.length])

  const handleDragEnd = useCallback(() => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) onReorder(dragIdx, dragOverIdx)
    setDragIdx(null)
    setDragOverIdx(null)
  }, [dragIdx, dragOverIdx, onReorder])

  // Swipe to complete handlers
  function onSwipeStart(id: number, e: React.TouchEvent) {
    swipeStartX.current = e.touches[0].clientX
    setSwipeId(id)
    setSwipeX(0)
  }
  function onSwipeMove(e: React.TouchEvent) {
    if (swipeId === null) return
    const dx = e.touches[0].clientX - swipeStartX.current
    if (dx > 0) setSwipeX(Math.min(dx, 100))
  }
  function onSwipeEnd() {
    if (swipeId !== null && swipeX > 60) {
      onToggle(swipeId)
    }
    setSwipeId(null)
    setSwipeX(0)
  }

  // Group activities
  const grouped = SECTIONS.map((sec) => ({
    ...sec,
    acts: dayActs
      .map((act, idx) => ({ act, idx }))
      .filter(({ act }) => act.time >= sec.from && act.time < sec.to),
  })).filter((g) => g.acts.length > 0)

  return (
    <div className="pt-3.5">
      {/* Morning briefing — only today, before noon */}
      {isToday && new Date().getHours() < 12 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="text-[13px] font-semibold mb-2">☀️ Buongiorno Stefano</div>
          <div className="text-[11px] text-muted-3 leading-relaxed">
            Oggi hai <span className="text-white font-medium">{total} attività</span>.
            {yesterdayStats ? (
              <> Ieri hai completato il <span className="text-white font-medium">{yesterdayStats.rate}%</span> ({yesterdayStats.completed}/{yesterdayStats.total}).</>
            ) : (
              <> Nessun dato di ieri.</>
            )}
            {nextAct && (
              <> Prossima: <span className="text-white font-medium">{nextAct.title}</span> alle {nextAct.time}.</>
            )}
          </div>
        </div>
      )}

      {/* Day header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="text-xs text-muted-1 capitalize">{fmtLong(curDate)}</div>
          <div className="text-[11px] text-muted-4 mt-px">
            {done}/{total} completate{!isToday ? ' · sola lettura' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold leading-none">{rate}%</div>
          <button
            onClick={() => setCurDate(new Date())}
            className="text-[10px] text-muted-3 bg-card border border-border px-2 py-[3px] rounded-[7px] cursor-pointer"
          >
            Oggi
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-input-bg rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
      </div>

      {/* Next activity highlight */}
      {isToday && nextAct && (() => {
        const nextTag = detectTaskTag(nextAct.title, nextAct.fromCal)
        return (
          <div className="bg-white text-black rounded-2xl p-3.5 mb-4 flex items-center gap-3">
            <div className="text-lg">{nextTag?.icon || '▶'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                {nextTag ? nextTag.label : 'Prossima'}
              </div>
              <div className="text-[14px] font-semibold truncate">{nextAct.title}</div>
            </div>
            <div className="text-[13px] font-bold">{nextAct.time}</div>
          </div>
        )
      })()}

      {/* Empty state */}
      {dayActs.length === 0 && (
        <div className="text-center py-12 text-muted-5 text-[13px]">Nessuna attività</div>
      )}

      {/* Activity list grouped */}
      <div ref={listRef}>
        {grouped.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px]">{section.icon}</span>
              <span className="text-[11px] text-muted-2 font-semibold uppercase tracking-widest">{section.label}</span>
              <span className="text-[10px] text-muted-4">
                {section.acts.filter(({ act }) => dayChecks[act.id]).length}/{section.acts.length}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {section.acts.map(({ act, idx }) => {
              const isDone = !!dayChecks[act.id]
              const isNext = act === nextAct
              const isPast = isToday && act.time < now && !isDone
              const hasNote = !!notes[`${ck}_${act.id}`]
              const isDragging = dragIdx === idx
              const isDropTarget = dragOverIdx === idx && dragIdx !== null && dragIdx !== idx
              const isSwiping = swipeId === act.id
              const tag = detectTaskTag(act.title, act.fromCal)

              return (
                <div
                  key={act.id}
                  className="rounded-[13px] mb-[7px] relative overflow-hidden"
                  style={{
                    border: `1px solid ${isDropTarget ? '#fff' : isNext ? '#fff' : isDone ? '#1e1e1e' : isPast ? '#1a1010' : '#141414'}`,
                    borderLeft: tag ? `3px solid ${tag.accent}` : undefined,
                    background: isDragging ? '#151515' : isDone ? '#060606' : isNext ? '#0f0f0f' : isPast ? '#0a0808' : '#0a0a0a',
                    opacity: isDragging ? 0.6 : isPast ? 0.5 : 1,
                    transform: isDropTarget ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 150ms, opacity 150ms',
                  }}
                >
                  {/* Swipe-to-complete background */}
                  {isSwiping && swipeX > 10 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-white flex items-center pl-4 text-black text-[12px] font-bold"
                      style={{ width: swipeX }}
                    >
                      {swipeX > 40 ? '✓' : ''}
                    </div>
                  )}

                  {/* Past activity label */}
                  {isPast && (
                    <div className="absolute -top-2 left-3 bg-[#333] text-[#888] text-[8px] font-bold px-[6px] py-[1px] rounded-[10px]">
                      SALTATA
                    </div>
                  )}

                  {isNext && !isDone && (
                    <div className="absolute -top-2 left-3 bg-white text-black text-[9px] font-bold px-[7px] py-[2px] rounded-[20px]">
                      ▶ ORA
                    </div>
                  )}

                  <div
                    className="flex items-center gap-2 py-[11px] px-3 relative"
                    style={{ transform: isSwiping ? `translateX(${swipeX}px)` : 'none', transition: isSwiping ? 'none' : 'transform 200ms' }}
                    onTouchStart={isToday && !isDone ? (e) => onSwipeStart(act.id, e) : undefined}
                    onTouchMove={isToday ? onSwipeMove : undefined}
                    onTouchEnd={isToday ? onSwipeEnd : undefined}
                  >
                    {/* Drag handle */}
                    {isToday && (
                      <div
                        className="shrink-0 flex items-center justify-center w-5 h-8 cursor-grab text-muted-5 text-[11px] select-none touch-none"
                        onTouchStart={(e) => { e.stopPropagation(); handleDragStart(idx, e) }}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                      >
                        ⋮⋮
                      </div>
                    )}

                    {/* Check */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(act.id) }}
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] text-black"
                      style={{
                        border: `1.5px solid ${isDone ? '#fff' : isNext ? '#555' : '#1f1f1f'}`,
                        background: isDone ? '#fff' : 'transparent',
                        cursor: !isToday ? 'not-allowed' : 'pointer',
                        opacity: !isToday ? 0.3 : 1,
                      }}
                    >
                      {isDone ? '✓' : ''}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(act)}>
                      <div className={`text-[13px] font-medium mb-0.5 flex items-center gap-1.5 ${isDone ? 'text-[#252525] line-through' : isPast ? 'text-[#555]' : 'text-[#e0e0e0]'}`}>
                        {tag && <span className="text-[12px] shrink-0">{tag.icon}</span>}
                        <span className="truncate">{act.title}</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <span className="text-[10px] text-muted-3">⏱{act.time}</span>
                        <span className="text-[10px] text-muted-5">·</span>
                        <span className="text-[10px] text-muted-3">{act.duration}min</span>
                        {tag && <span className="text-[8px] text-muted-3 border border-border px-[5px] py-px rounded-[5px]">{tag.label}</span>}
                        {act.streak && <span className="text-[9px] text-muted-3">🔥</span>}
                        {act.fromCal && <span className="text-[9px] text-white bg-[#1a1a1a] border border-[#333] px-1.5 py-px rounded-[5px]">da Calendar</span>}
                        {hasNote && <span className="text-[10px] text-muted-1">✎</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
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

      {/* Journal */}
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
            <div className="text-[13px] text-[#888] leading-relaxed italic">"{journal[ck].text}"</div>
          )}
        </div>
      )}
    </div>
  )
}

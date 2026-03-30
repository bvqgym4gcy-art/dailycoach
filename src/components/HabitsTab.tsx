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
  { label: 'Mattina', from: '00:00', to: '12:00', icon: '☀️', fromH: 0, toH: 12 },
  { label: 'Pomeriggio', from: '12:00', to: '18:00', icon: '🌤', fromH: 12, toH: 18 },
  { label: 'Sera', from: '18:00', to: '23:59', icon: '🌙', fromH: 18, toH: 24 },
]

export function HabitsTab({
  curDate, setCurDate, dayActs, dayChecks, done, total, rate, isToday, ck, notes, journal, history,
  onToggle, onEdit, onAdd, onJournal, onReorder,
}: Props) {
  const now = nowHHMM()
  const currentHour = new Date().getHours()
  const nowMin = (() => { const [h, m] = now.split(':').map(Number); return h * 60 + m })()

  // Filter mode
  const [showIncomplete, setShowIncomplete] = useState(false)

  // Determine which section is "active" based on current hour
  const activeSectionIdx = SECTIONS.findIndex((s) => currentHour >= s.fromH && currentHour < s.toH)

  // Find NEXT undone activity: simply the first undone task with time > now
  // Find CURRENT: the most recent undone task with time <= now (what you should be doing)
  const { currentAct, nextAct } = isToday
    ? (() => {
        const undone = dayActs.filter((a) => !dayChecks[a.id])

        // Current = last undone task whose time has passed (most recent)
        let current: Activity | null = null
        for (const a of undone) {
          const [h, m] = a.time.split(':').map(Number)
          const actMin = h * 60 + m
          if (actMin <= nowMin) current = a // keep overwriting — last one wins (most recent past)
        }

        // Next = first undone task in the future
        const next = undone.find((a) => {
          const [h, m] = a.time.split(':').map(Number)
          return h * 60 + m > nowMin
        }) || null

        return { currentAct: current, nextAct: next }
      })()
    : { currentAct: null, nextAct: null }

  // Yesterday stats
  const yesterdayKey = dateKey(addDays(new Date(), -1))
  const yesterdayStats = history[yesterdayKey]

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragStartY = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)
  const itemHeights = useRef<number[]>([])

  // Swipe state
  const [swipeId, setSwipeId] = useState<number | null>(null)
  const [swipeX, setSwipeX] = useState(0)
  const swipeStartX = useRef(0)
  const swipeStartY2 = useRef(0)
  const swipeLocked = useRef(false)

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

  function onSwipeStart(id: number, e: React.TouchEvent) {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY2.current = e.touches[0].clientY
    swipeLocked.current = false
    setSwipeId(id)
    setSwipeX(0)
  }
  function onSwipeMove(e: React.TouchEvent) {
    if (swipeId === null) return
    const dx = e.touches[0].clientX - swipeStartX.current
    const dy = e.touches[0].clientY - swipeStartY2.current
    if (!swipeLocked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      if (Math.abs(dy) > Math.abs(dx)) { setSwipeId(null); setSwipeX(0); return }
      swipeLocked.current = true
    }
    if (swipeLocked.current) {
      e.stopPropagation()
      if (dx > 0) setSwipeX(Math.min(dx, 100))
    }
  }
  function onSwipeEnd(e: React.TouchEvent) {
    if (swipeId !== null && swipeX > 60) { e.stopPropagation(); onToggle(swipeId) }
    setSwipeId(null)
    setSwipeX(0)
    swipeLocked.current = false
  }

  // Filter + group activities
  const filteredActs = showIncomplete ? dayActs.filter((a) => !dayChecks[a.id]) : dayActs

  const grouped = SECTIONS.map((sec, secIdx) => ({
    ...sec,
    secIdx,
    acts: filteredActs
      .map((act, idx) => ({ act, idx: dayActs.indexOf(act) }))
      .filter(({ act }) => act.time >= sec.from && act.time < sec.to),
  })).filter((g) => g.acts.length > 0)

  const incomplete = total - done

  return (
    <div className="pt-3.5">
      {/* Morning briefing — only today, before noon */}
      {isToday && new Date().getHours() < 12 && !showIncomplete && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="text-[13px] font-semibold mb-2">☀️ Buongiorno Stefano</div>
          <div className="text-[11px] text-muted-3 leading-relaxed">
            Oggi hai <span className="text-white font-medium">{total} attività</span>.
            {yesterdayStats && (
              <> Ieri hai completato il <span className="text-white font-medium">{yesterdayStats.rate}%</span>.</>
            )}
            {nextAct && (
              <> Prossima: <span className="text-white font-medium">{nextAct.title}</span> alle {nextAct.time}.</>
            )}
          </div>
        </div>
      )}

      {/* STICKY: Progress + Next activity */}
      <div className="sticky top-[130px] z-10 bg-black pb-2">
        {/* Day header — entire bar is tappable for incomplete filter */}
        <div
          className="flex justify-between items-end mb-2 cursor-pointer"
          onClick={incomplete > 0 && isToday ? () => setShowIncomplete(!showIncomplete) : undefined}
        >
          <div>
            <div className="text-xs text-muted-1 capitalize">{fmtLong(curDate)}</div>
            <div className="flex items-center gap-2 mt-px">
              <span className="text-[11px] text-muted-4">{done}/{total}</span>
              {incomplete > 0 && isToday && (
                <span className="text-[11px]" style={{ color: showIncomplete ? '#fff' : '#666' }}>
                  {showIncomplete ? '✕ Mostra tutte' : `· ${incomplete} incomplete`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold leading-none">{rate}%</div>
            <button
              onClick={(e) => { e.stopPropagation(); setCurDate(new Date()) }}
              className="text-[10px] text-muted-3 bg-card border border-border px-2 py-[3px] rounded-[7px] cursor-pointer"
            >
              Oggi
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-input-bg rounded-full mb-2 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
        </div>

        {/* Current / Next activity — sticky */}
        {isToday && (currentAct || nextAct) && (
          <div className="flex gap-2">
            {currentAct && (() => {
              const curTag = detectTaskTag(currentAct.title, currentAct.fromCal)
              return (
                <div className="flex-1 bg-white text-black rounded-xl p-2.5 flex items-center gap-2">
                  <span className="text-base">{curTag?.icon || '▶'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">Adesso</div>
                    <div className="text-[12px] font-semibold truncate">{currentAct.title}</div>
                  </div>
                  <span className="text-[11px] font-bold shrink-0">{currentAct.time}</span>
                </div>
              )
            })()}
            {nextAct && (() => {
              const nextTag = detectTaskTag(nextAct.title, nextAct.fromCal)
              return (
                <div className={`${currentAct ? 'w-[120px]' : 'flex-1'} bg-[#111] border border-border rounded-xl p-2.5 flex items-center gap-2`}>
                  <span className="text-sm">{nextTag?.icon || '◇'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-semibold uppercase tracking-widest text-muted-3">Dopo</div>
                    <div className="text-[11px] font-medium truncate text-muted-2">{nextAct.title}</div>
                  </div>
                  <span className="text-[10px] text-muted-3 shrink-0">{nextAct.time}</span>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredActs.length === 0 && (
        <div className="text-center py-12 text-muted-5 text-[13px]">
          {showIncomplete ? 'Tutto completato!' : 'Nessuna attività'}
        </div>
      )}

      {/* Activity list grouped by time section */}
      <div ref={listRef}>
        {grouped.map((section) => {
          const isActiveSection = isToday && section.secIdx === activeSectionIdx
          const sectionDone = section.acts.filter(({ act }) => dayChecks[act.id]).length
          const sectionTotal = section.acts.length

          return (
            <div key={section.label} className="mb-4">
              {/* Section header */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] ${isActiveSection ? '' : 'opacity-50'}`}>{section.icon}</span>
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${isActiveSection ? 'text-white' : 'text-muted-3'}`}>
                  {section.label}
                </span>
                <span className="text-[10px] text-muted-4">{sectionDone}/{sectionTotal}</span>
                {isActiveSection && <span className="text-[8px] text-black bg-white font-bold px-1.5 py-[1px] rounded-[4px]">ORA</span>}
                <div className="flex-1 h-px bg-border" />
              </div>

              {section.acts.map(({ act, idx }) => {
                const isDone = !!dayChecks[act.id]
                const isCurrent = act === currentAct
                const isUpNext = act === nextAct
                const [aH, aM] = act.time.split(':').map(Number)
                const actMin = aH * 60 + aM
                const isPast = isToday && !isDone && !isCurrent && actMin < nowMin - 15
                const hasNote = !!notes[`${ck}_${act.id}`]
                const isDragging = dragIdx === idx
                const isDropTarget = dragOverIdx === idx && dragIdx !== null && dragIdx !== idx
                const isSwiping = swipeId === act.id
                const tag = detectTaskTag(act.title, act.fromCal)
                // Dim tasks outside active section
                const dimmed = isToday && !isActiveSection && !isCurrent && !isUpNext

                return (
                  <div
                    key={act.id}
                    className="rounded-[13px] mb-[7px] overflow-hidden"
                    style={{
                      border: `1px solid ${isDropTarget ? '#fff' : isCurrent ? '#fff' : isDone ? '#1e1e1e' : isPast ? '#1a1010' : '#141414'}`,
                      borderLeft: tag ? `3px solid ${tag.accent}` : undefined,
                      background: isDragging ? '#151515' : isDone ? '#080808' : isCurrent ? '#111' : isPast ? '#0a0a0a' : '#0d0d0d',
                      opacity: isDragging ? 0.6 : isPast ? 0.7 : dimmed ? 0.5 : 1,
                      transform: isDropTarget ? 'scale(1.02)' : 'scale(1)',
                      transition: 'transform 150ms, opacity 150ms',
                    }}
                  >
                    {isSwiping && swipeX > 10 && (
                      <div className="absolute inset-y-0 left-0 bg-white flex items-center pl-4 text-black text-[12px] font-bold z-10" style={{ width: swipeX }}>
                        {swipeX > 40 ? '✓' : ''}
                      </div>
                    )}

                    <div
                      className="flex items-center gap-2 py-[11px] px-3 relative"
                      style={{ transform: isSwiping ? `translateX(${swipeX}px)` : 'none', transition: isSwiping ? 'none' : 'transform 200ms' }}
                      onTouchStart={isToday && !isDone ? (e) => onSwipeStart(act.id, e) : undefined}
                      onTouchMove={isToday ? onSwipeMove : undefined}
                      onTouchEnd={isToday ? onSwipeEnd : undefined}
                    >
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

                      <button
                        onClick={(e) => { e.stopPropagation(); onToggle(act.id) }}
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] text-black"
                        style={{
                          border: `1.5px solid ${isDone ? '#fff' : isCurrent ? '#555' : '#1f1f1f'}`,
                          background: isDone ? '#fff' : 'transparent',
                          cursor: !isToday ? 'not-allowed' : 'pointer',
                          opacity: !isToday ? 0.3 : 1,
                        }}
                      >
                        {isDone ? '✓' : ''}
                      </button>

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(act)}>
                        <div className={`text-[13px] font-medium mb-1 flex items-start gap-1.5 ${isDone ? 'text-[#303030] line-through' : isPast ? 'text-[#666]' : 'text-[#e0e0e0]'}`}>
                          {tag && <span className="text-[12px] shrink-0 leading-[18px]">{tag.icon}</span>}
                          <span className="break-words">{act.title}</span>
                        </div>
                        {(isCurrent || isUpNext || isPast) && !isDone && (
                          <div className="mb-1">
                            {isCurrent && <span className="text-[10px] text-black bg-white font-bold px-2 py-[2px] rounded-[5px] inline-block">▶ ORA</span>}
                            {isUpNext && !isCurrent && <span className="text-[10px] text-[#aaa] bg-[#1a1a1a] font-semibold px-2 py-[2px] rounded-[5px] inline-block">PROSSIMA</span>}
                            {isPast && <span className="text-[10px] text-[#999] bg-[#1a1a1a] font-semibold px-2 py-[2px] rounded-[5px] inline-block">SALTATA</span>}
                          </div>
                        )}
                        <div className="flex gap-1.5 flex-wrap items-center">
                          <span className="text-[10px] text-muted-3">{act.time}</span>
                          <span className="text-[10px] text-muted-5">·</span>
                          <span className="text-[10px] text-muted-3">{act.duration}min</span>
                          {tag && <span className="text-[9px] text-muted-3 border border-border px-[5px] py-px rounded-[5px] shrink-0">{tag.label}</span>}
                          {act.streak && <span className="text-[9px] text-muted-3">🔥</span>}
                          {act.fromCal && <span className="text-[9px] text-white bg-[#1a1a1a] border border-[#333] px-1.5 py-px rounded-[5px] shrink-0">da Calendar</span>}
                          {hasNote && <span className="text-[10px] text-muted-1">✎</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Add button */}
      {isToday && (
        <button onClick={onAdd} className="w-full p-3 mt-0.5 border border-dashed border-border rounded-[13px] text-muted-5 text-xs bg-transparent cursor-pointer">
          + Aggiungi attività
        </button>
      )}

      {/* Journal */}
      {isToday && (
        <div className="bg-card border border-border rounded-2xl p-4 mt-2">
          <div className="flex justify-between items-center" style={{ marginBottom: journal[ck] ? 8 : 0 }}>
            <div className="text-xs font-semibold text-muted-1">📓 Journal di oggi</div>
            <button onClick={onJournal} className="text-[11px] text-white bg-border border border-input-border px-2.5 py-1 rounded-lg cursor-pointer">
              {journal[ck] ? 'Modifica' : '+ Scrivi'}
            </button>
          </div>
          {journal[ck] && <div className="text-[13px] text-[#888] leading-relaxed italic">"{journal[ck].text}"</div>}
        </div>
      )}
    </div>
  )
}

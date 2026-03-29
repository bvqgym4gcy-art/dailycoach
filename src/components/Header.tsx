import { useRef, useEffect } from 'react'
import type { Tab, HistoryEntry } from '../types'
import { dateKey, todayKey, addDays } from '../lib/utils'
import { MOODS, DAYS_IT } from '../config'

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
  curDate: Date
  setCurDate: (d: Date) => void
  ck: string
  history: Record<string, HistoryEntry>
  streak: number
  todayMood: number | undefined
  saveStatus: string
  onMoodClick: () => void
  isToday: boolean
}

const TABS: [Tab, string][] = [
  ['today', 'Habits'],
  ['calendar', 'Calendar'],
  ['stats', 'Stats'],
  ['diet', 'Dieta'],
  ['chat', 'Chat'],
  ['ai', 'AI'],
]

// Generate 35 days: 14 past + today + 20 future
const STRIP_PAST = 14
const STRIP_FUTURE = 20
const STRIP_TOTAL = STRIP_PAST + 1 + STRIP_FUTURE

function getStripDates(): Date[] {
  const today = new Date()
  return Array.from({ length: STRIP_TOTAL }, (_, i) => addDays(today, i - STRIP_PAST))
}

export function Header({ tab, setTab, curDate, setCurDate, ck, history, streak, todayMood, saveStatus, onMoodClick }: Props) {
  const moodEmoji = todayMood ? MOODS.find((m) => m.v === todayMood)?.e : '😐'
  const scrollRef = useRef<HTMLDivElement>(null)
  const stripDates = getStripDates()
  const hasScrolled = useRef(false)

  // Auto-scroll to selected day
  useEffect(() => {
    if (tab !== 'today' || !scrollRef.current) return
    const idx = stripDates.findIndex((d) => dateKey(d) === ck)
    if (idx < 0) return
    const el = scrollRef.current.children[idx] as HTMLElement
    if (!el) return
    // On first render, scroll instantly. After that, smooth scroll.
    el.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: hasScrolled.current ? 'smooth' : 'instant',
    })
    hasScrolled.current = true
  }, [ck, tab])

  return (
    <div className="sticky top-0 z-20 bg-black border-b border-border px-5 pt-3.5 pb-2.5">
      {/* Top row */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[10px] text-muted-2 uppercase tracking-widest">
            {new Date().toLocaleDateString('it-IT', { weekday: 'long' })}
          </div>
          <div className="text-xl font-bold tracking-tight">Daily Coach</div>
        </div>
        <div className="flex gap-2 items-center">
          {saveStatus && <div className="text-[10px] text-muted-2">{saveStatus}</div>}
          <button
            onClick={onMoodClick}
            className="bg-input-bg border border-muted-6 rounded-xl w-[38px] h-[38px] text-lg flex items-center justify-center cursor-pointer"
          >
            {moodEmoji}
          </button>
          <div className="bg-input-bg border border-muted-6 rounded-xl px-3 py-1.5 text-center">
            <div className="text-base font-bold">🔥{streak}</div>
            <div className="text-[9px] text-muted-2">streak</div>
          </div>
        </div>
      </div>

      {/* Scrollable day strip */}
      {tab === 'today' && (
        <div
          ref={scrollRef}
          className="flex gap-1.5 mb-2.5 overflow-x-auto no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {stripDates.map((d, i) => {
            const k = dateKey(d)
            const sel = k === ck
            const isT = k === todayKey()
            const v = history[k]
            const isNewMonth = i === 0 || d.getDate() === 1

            return (
              <button
                key={k}
                onClick={() => setCurDate(new Date(d))}
                className="flex flex-col items-center py-1.5 rounded-[11px] cursor-pointer shrink-0"
                style={{
                  width: 44,
                  minWidth: 44,
                  scrollSnapAlign: 'center',
                  border: `1px solid ${sel ? '#fff' : isT ? '#2a2a2a' : '#141414'}`,
                  background: sel ? '#fff' : '#0a0a0a',
                }}
              >
                {isNewMonth ? (
                  <div className={`text-[8px] mb-px font-semibold ${sel ? 'text-black' : 'text-muted-3'}`}>
                    {d.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase()}
                  </div>
                ) : (
                  <div className={`text-[9px] mb-px ${sel ? 'text-black' : 'text-muted-2'}`}>
                    {DAYS_IT[d.getDay()]}
                  </div>
                )}
                <div className={`text-sm font-bold ${sel ? 'text-black' : isT ? 'text-white' : 'text-muted-4'}`}>
                  {d.getDate()}
                </div>
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{
                    background: v?.completed && v.completed > 0 ? (sel ? '#000' : '#fff') : 'transparent',
                  }}
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-[3px]">
        {TABS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 py-1.5 px-0.5 rounded-[9px] text-[11px] font-semibold cursor-pointer ${
              tab === v
                ? 'bg-white text-black border border-white'
                : 'bg-transparent text-muted-3 border border-transparent'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

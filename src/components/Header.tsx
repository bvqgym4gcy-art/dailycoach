import type { Tab, HistoryEntry } from '../types'
import { dateKey, todayKey } from '../lib/utils'
import { MOODS, DAYS_IT } from '../config'

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
  curDate: Date
  setCurDate: (d: Date) => void
  weekDates: Date[]
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

export function Header({ tab, setTab, curDate, setCurDate, weekDates, ck, history, streak, todayMood, saveStatus, onMoodClick, isToday }: Props) {
  const moodEmoji = todayMood ? MOODS.find((m) => m.v === todayMood)?.e : '😐'

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

      {/* Week strip */}
      {tab === 'today' && (
        <div className="flex gap-1 mb-2.5">
          {weekDates.map((d, i) => {
            const k = dateKey(d)
            const sel = k === ck
            const isT = k === todayKey()
            const v = history[k]
            return (
              <button
                key={i}
                onClick={() => setCurDate(new Date(d))}
                className="flex-1 flex flex-col items-center py-1.5 px-0.5 rounded-[11px] cursor-pointer"
                style={{
                  border: `1px solid ${sel ? '#fff' : isT ? '#2a2a2a' : '#141414'}`,
                  background: sel ? '#fff' : '#0a0a0a',
                }}
              >
                <div className={`text-[9px] mb-px ${sel ? 'text-black' : 'text-muted-2'}`}>
                  {DAYS_IT[d.getDay()]}
                </div>
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

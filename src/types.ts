export interface Activity {
  id: number
  time: string
  title: string
  category: 'salute' | 'sport' | 'lavoro' | 'routine' | 'sociale'
  duration: number
  streak: boolean
  fromCal?: boolean
}

export interface HistoryEntry {
  completed: number
  total: number
  rate: number
}

export interface JournalEntry {
  text: string
  ts: string
  rate: number
  done?: number
  total?: number
  mood: number | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIInsight {
  type: 'warning' | 'tip' | 'positive'
  title: string
  text: string
}

export type Tab = 'today' | 'calendar' | 'stats' | 'diet' | 'protocols' | 'life' | 'chat' | 'ai'

// Mood Protocols
export interface ProtocolRule {
  id: string
  icon: string
  label: string
  type: 'do' | 'dont'        // "do" = must do daily, "dont" = must avoid
  frequency?: 'daily' | '3x_week'  // default daily
}

export interface MoodProtocol {
  id: string
  name: string
  icon: string
  description: string
  durationDays: number
  rules: ProtocolRule[]
}

export interface ActiveProtocol {
  protocolId: string
  startDate: string           // YYYY-MM-DD
  dailyLog: Record<string, Record<string, boolean>>  // date → ruleId → completed/respected
}
export type Category = Activity['category']

export interface DayMealPlan {
  colazione?: string
  spuntino1?: string
  pranzo?: string
  spuntino2?: string
  merenda?: string
  cena?: string
}

// Smart scheduling rule: "when anchor moves, shift dependent by offsetMin"
export interface ScheduleRule {
  anchor: string       // keyword match for anchor activity (e.g. "palestra")
  dependent: string    // keyword match for dependent activity (e.g. "collagene pre")
  offsetMin: number    // minutes after anchor
  trigger: 'move' | 'check'  // 'move' = when time changes, 'check' = when checked off
  learned: number      // times this rule has been confirmed by usage
}

export interface CalendarEvent {
  date: string
  time: string
  title: string
  duration: number
  category: Activity['category']
}

export type SportType = 'palestra' | 'nuoto' | 'corsa' | 'yoga'

export interface DailyCheckInData {
  sport: SportType | 'skip'  // which sport, or 'skip' for rest day
  sportTime?: string          // HH:MM
}

export interface AppData {
  checks: Record<string, Record<number, boolean>>
  history: Record<string, HistoryEntry>
  notes: Record<string, string>
  moods: Record<string, number>
  acts: Record<string, Activity[]>
  journal: Record<string, JournalEntry>
  mealPlans?: Record<string, DayMealPlan>
  rules?: ScheduleRule[]
  calendarEvents?: CalendarEvent[]
  calendarSyncedAt?: string
  dailyCheckIn?: Record<string, DailyCheckInData>
  activeProtocol?: ActiveProtocol | null
}

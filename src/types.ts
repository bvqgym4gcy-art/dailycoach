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

export type Tab = 'today' | 'calendar' | 'stats' | 'chat' | 'ai'
export type Category = Activity['category']

export interface AppData {
  checks: Record<string, Record<number, boolean>>
  history: Record<string, HistoryEntry>
  notes: Record<string, string>
  moods: Record<string, number>
  acts: Record<string, Activity[]>
  journal: Record<string, JournalEntry>
}

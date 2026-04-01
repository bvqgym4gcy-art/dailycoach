export const SUPA_URL = 'https://tnijyvhjzykraawnkcvy.supabase.co'
export const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuaWp5dmhqenlrcmFhd25rY3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDI5NzgsImV4cCI6MjA5MDI3ODk3OH0.vhA2szt8dZWNOh9RbacPAEA0fHfdR5Hd2BqzXU2ZdFk'
export const USER_ID = 'stefano'

export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
export const AI_MODEL_FAST = 'claude-sonnet-4-20250514'    // chat — reliable with tools
export const AI_MODEL_SMART = 'claude-sonnet-4-20250514'   // analysis — deeper thinking

export const MOODS = [
  { v: 1, e: '😞' },
  { v: 2, e: '😕' },
  { v: 3, e: '😐' },
  { v: 4, e: '🙂' },
  { v: 5, e: '😄' },
] as const

export const CATS = ['salute', 'sport', 'lavoro', 'routine', 'sociale'] as const
export const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'] as const

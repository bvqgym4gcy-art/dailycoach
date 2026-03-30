// Auto-detect task type from title keywords
// Returns a visual tag: icon + accent color (border-left) for instant recognition

export interface TaskTag {
  icon: string
  label: string
  accent: string // left-border color
}

const RULES: { keywords: string[]; tag: TaskTag }[] = [
  {
    keywords: ['call', 'meet', 'zoom', 'video', 'sal/', 'brendan', 'weekly update', 'adtucon', 'visio'],
    tag: { icon: '📹', label: 'Video Call', accent: '#333' },
  },
  {
    keywords: ['check the strategy', 'strategy'],
    tag: { icon: '📊', label: 'Strategy', accent: '#2a2a2a' },
  },
  {
    keywords: ['palestra', 'sport', 'fisio', 'allenamento'],
    tag: { icon: '💪', label: 'Sport', accent: '#222' },
  },
  {
    keywords: ['pillola', 'pill', 'olio di cocco'],
    tag: { icon: '💊', label: 'Pillola', accent: '#1a1a1a' },
  },
  {
    keywords: ['pranzo', 'cena', 'colazione', 'merenda', 'spuntino', 'digiuno'],
    tag: { icon: '🍽', label: 'Pasto', accent: '#1e1e1e' },
  },
  {
    keywords: ['newsletter', 'focus', 'lavoro', 'piano'],
    tag: { icon: '💻', label: 'Focus', accent: '#252525' },
  },
  {
    keywords: ['compleanno', 'cena (calendario)', 'aperitivo', 'sociale'],
    tag: { icon: '🎉', label: 'Sociale', accent: '#2a2a2a' },
  },
  {
    keywords: ['✈', 'going to', 'viaggio', 'volo'],
    tag: { icon: '✈️', label: 'Viaggio', accent: '#2a2a2a' },
  },
]

export function detectTaskTag(title: string, fromCal?: boolean): TaskTag | null {
  const lower = title.toLowerCase()

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.tag
    }
  }

  // Generic calendar event
  if (fromCal) {
    return { icon: '📅', label: 'Evento', accent: '#222' }
  }

  return null
}

import { useState } from 'react'
import type { Activity, HistoryEntry, JournalEntry, AIInsight } from '../types'
import { buildContext } from '../ai/context'
import { ANTHROPIC_API_KEY, AI_MODEL } from '../config'

interface Props {
  ck: string
  dayActs: Activity[]
  dayChecks: Record<number, boolean>
  checks: Record<string, Record<number, boolean>>
  allActs: Record<string, Activity[]>
  history: Record<string, HistoryEntry>
  moods: Record<string, number>
  journal: Record<string, JournalEntry>
}

export function AICoachTab({ ck, dayActs, dayChecks, checks, allActs, history, moods, journal }: Props) {
  const [aiRes, setAiRes] = useState<AIInsight[] | null>(null)
  const [aiLoad, setAiLoad] = useState(false)

  async function fetchAI() {
    setAiLoad(true)
    setAiRes(null)
    const ctx = buildContext(ck, dayActs, dayChecks, checks, allActs, history, moods, journal)
    const prompt = `${ctx}\n\nDai 3 insight PROATTIVI basati sui pattern reali. Cosa sta funzionando, cosa no, cosa ottimizzare. Rispondi SOLO JSON: [{"type":"warning"|"tip"|"positive","title":"3 parole","text":"1-2 righe dirette"}]`

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await r.json()
      const txt = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '[]'
      setAiRes(JSON.parse(txt.replace(/```json|```/g, '').trim()))
    } catch (e) {
      console.error('ai error', e)
      setAiRes([{ type: 'warning', title: 'Errore', text: 'Riprova.' }])
    }
    setAiLoad(false)
  }

  return (
    <div className="pt-3.5">
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="text-sm font-bold mb-[3px]">AI Coach</div>
        <div className="text-[11px] text-muted-3 mb-3.5">
          Analizza i tuoi pattern reali e ti dice cosa ottimizzare.
        </div>
        <button
          onClick={fetchAI}
          disabled={aiLoad}
          className={`w-full p-[13px] rounded-[11px] text-[13px] font-semibold cursor-pointer ${
            aiLoad
              ? 'bg-card border border-border text-muted-4 cursor-not-allowed'
              : 'bg-white border border-white text-black'
          }`}
        >
          {aiLoad ? 'Analisi in corso...' : 'Analizza la mia giornata'}
        </button>
      </div>

      {(aiRes || []).map((ins, i) => (
        <div key={i} className="bg-card border border-muted-6 rounded-2xl p-4 mt-3">
          <div className="text-[10px] font-bold text-muted-2 uppercase tracking-widest mb-1.5">
            {ins.title}
          </div>
          <div className="text-[13px] text-[#bbb] leading-relaxed">{ins.text}</div>
        </div>
      ))}
    </div>
  )
}

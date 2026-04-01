import { useState, useRef, useEffect } from 'react'
import type { Activity, HistoryEntry, JournalEntry, ChatMessage, ActiveProtocol, DailyCheckInData, ScheduleRule, DayMealPlan } from '../types'
import { buildContext } from '../ai/context'
import { AI_TOOLS, handleToolCall, type ToolCall, type ToolHandlers } from '../ai/tools'
import { ANTHROPIC_API_KEY, AI_MODEL_FAST } from '../config'

interface Props {
  ck: string
  dayActs: Activity[]
  dayChecks: Record<number, boolean>
  checks: Record<string, Record<number, boolean>>
  allActs: Record<string, Activity[]>
  history: Record<string, HistoryEntry>
  moods: Record<string, number>
  journal: Record<string, JournalEntry>
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  toolHandlers: ToolHandlers
  activeProtocol?: ActiveProtocol | null
  dailyCheckIn?: Record<string, DailyCheckInData>
  rules?: ScheduleRule[]
  notes?: Record<string, string>
  mealPlans?: Record<string, DayMealPlan>
}

export function ChatTab({
  ck, dayActs, dayChecks, checks, allActs, history, moods, journal,
  messages, setMessages, toolHandlers,
  activeProtocol, dailyCheckIn, rules, notes, mealPlans,
}: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep full API conversation history (includes tool calls/results)
  // This is separate from the display messages — it tracks the full API state
  const apiHistory = useRef<any[]>([])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function callAPI(msgs: any[]): Promise<any> {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: AI_MODEL_FAST,
        max_tokens: 2000,
        tools: AI_TOOLS,
        messages: msgs,
      }),
    })
    return r.json()
  }

  async function sendChat() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      // Build fresh context every time (reflects latest state)
      const ctx = buildContext(ck, dayActs, dayChecks, checks, allActs, history, moods, journal, activeProtocol, dailyCheckIn, rules, notes, mealPlans)

      // If this is the first message, initialize API history with system context
      if (apiHistory.current.length === 0) {
        apiHistory.current = [
          { role: 'user', content: ctx },
          { role: 'assistant', content: 'Ciao Stefano! Sono Sally, ho tutti i tuoi dati. Dimmi cosa vuoi fare.' },
        ]
      }

      // Add user message to API history
      apiHistory.current.push({ role: 'user', content: userMsg })

      // Call API
      let data = await callAPI(apiHistory.current)

      if (data.error) {
        setMessages((m) => [...m, { role: 'assistant', content: `Errore: ${data.error.message || 'Riprova.'}` }])
        // Remove the failed user message from history
        apiHistory.current.pop()
        setLoading(false)
        return
      }

      // Tool use loop — keep full conversation history for context
      let allText = ''
      let allToolResults: string[] = []
      let iterations = 0

      while (iterations < 10) {
        iterations++

        // Extract text and tool calls from response
        const textParts = (data.content || [])
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('')
        const toolCalls: ToolCall[] = (data.content || [])
          .filter((b: any) => b.type === 'tool_use')

        if (textParts) allText += textParts

        // If no tool calls, we're done
        if (toolCalls.length === 0 || data.stop_reason !== 'tool_use') break

        // Add assistant response (with tool calls) to history
        apiHistory.current.push({ role: 'assistant', content: data.content })

        // Execute ALL tool calls and collect results
        const toolResultBlocks = toolCalls.map((tool) => {
          const result = handleToolCall(tool, toolHandlers)
          allToolResults.push(`✅ ${result}`)
          return {
            type: 'tool_result' as const,
            tool_use_id: tool.id,
            content: result,
          }
        })

        // Add tool results to history
        apiHistory.current.push({ role: 'user', content: toolResultBlocks })

        // Call API again with full history — it knows what it already did
        data = await callAPI(apiHistory.current)

        if (data.error) {
          allText += `\n\nErrore durante l'esecuzione: ${data.error.message}`
          break
        }
      }

      // Extract final text
      const finalText = (data.content || [])
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('')
      if (finalText) allText += finalText

      // Add final assistant response to API history
      apiHistory.current.push({ role: 'assistant', content: data.content || [{ type: 'text', text: allText }] })

      // Build display message
      let displayMsg = allText
      if (!displayMsg && allToolResults.length > 0) {
        displayMsg = allToolResults.join('\n')
      }

      setMessages((m) => [...m, { role: 'assistant', content: displayMsg || 'Fatto!' }])
    } catch (err: any) {
      console.error('chat error', err)
      setMessages((m) => [...m, { role: 'assistant', content: `Errore di connessione: ${err.message || 'Riprova.'}` }])
      // Remove failed user message from history
      apiHistory.current.pop()
    }
    setLoading(false)
  }

  // Reset API history when messages are cleared
  useEffect(() => {
    if (messages.length === 0) {
      apiHistory.current = []
    }
  }, [messages])

  const hour = new Date().getHours()
  const suggestions = hour < 12
    ? [
        'Organizzami la giornata',
        'Cosa devo fare adesso?',
        'Quali pillole mi mancano?',
        'Aggiungi 3 task per oggi',
      ]
    : hour < 18
      ? [
          'Come sto andando oggi?',
          'Cosa ho saltato?',
          'Ottimizza il mio pomeriggio',
          'Spunta tutte le pillole della mattina',
        ]
      : [
          'Com\'è andata oggi?',
          'Dammi un riassunto della giornata',
          'Scrivi il journal per me',
          'Cosa devo preparare per domani?',
        ]

  return (
    <div className="pt-3.5 flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-semibold mb-1.5">Sally</div>
            <div className="text-xs text-muted-2 mb-4">
              Conosco tutta la tua giornata. Posso aggiungere, spostare, completare attività, impostare pasti, analizzare i tuoi pattern. Chiedimi qualsiasi cosa.
            </div>
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="block w-full text-left p-2.5 mb-2 bg-input-bg border border-border rounded-[10px] text-[#888] text-xs cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-white text-black rounded-[18px_18px_4px_18px]'
                  : 'bg-input-bg text-[#ddd] border border-border rounded-[18px_18px_18px_4px]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="px-3.5 py-2.5 rounded-[18px_18px_18px_4px] bg-input-bg border border-border text-muted-2 text-[13px]">
              ⏳ Sto lavorando...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendChat()
            }
          }}
          placeholder="Parla con Sally..."
          className="flex-1 bg-input-bg border border-input-border rounded-[10px] px-3 py-2.5 text-white text-sm"
        />
        <button
          onClick={sendChat}
          disabled={loading || !input.trim()}
          className={`px-4 py-2.5 border border-input-border rounded-[10px] text-sm font-semibold cursor-pointer ${
            input.trim() ? 'bg-white text-black' : 'bg-input-bg text-muted-3'
          }`}
        >
          →
        </button>
      </div>
    </div>
  )
}

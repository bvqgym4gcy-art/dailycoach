import { useState, useRef, useEffect } from 'react'
import type { Activity, HistoryEntry, JournalEntry, ChatMessage } from '../types'
import { buildContext } from '../ai/context'
import { AI_TOOLS, handleToolCall, type ToolCall, type ToolHandlers } from '../ai/tools'
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
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  toolHandlers: ToolHandlers
}

export function ChatTab({
  ck, dayActs, dayChecks, checks, allActs, history, moods, journal,
  messages, setMessages, toolHandlers,
}: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function sendChat() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const ctx = buildContext(ck, dayActs, dayChecks, checks, allActs, history, moods, journal)

      // Build the full list of activities with IDs for tool use context
      const actList = dayActs.map((a) => `ID:${a.id} | ${a.time} ${a.title} [${dayChecks[a.id] ? 'FATTO' : 'SALTATO'}]`).join('\n')

      const apiMessages = [
        { role: 'user' as const, content: `${ctx}\n\nLISTA ATTIVITÀ CON ID (per i tool):\n${actList}` },
        { role: 'assistant' as const, content: 'Capito. Ho tutti i tuoi dati e posso eseguire azioni. Dimmi cosa vuoi.' },
        ...newMsgs,
      ]

      let reply = ''
      let toolResults: string[] = []

      // First API call
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
          max_tokens: 1500,
          tools: AI_TOOLS,
          messages: apiMessages,
        }),
      })

      let data = await r.json()

      // Handle tool use loop (max 3 iterations)
      let iterations = 0
      while (data.stop_reason === 'tool_use' && iterations < 3) {
        iterations++
        const toolBlocks: ToolCall[] = (data.content || []).filter(
          (b: { type: string }) => b.type === 'tool_use'
        )
        const textBlocks = (data.content || [])
          .filter((b: { type: string }) => b.type === 'text')
          .map((b: { text: string }) => b.text)
          .join('')

        if (textBlocks) reply += textBlocks

        // Execute each tool
        const toolResultMessages = toolBlocks.map((tool) => {
          const result = handleToolCall(tool, toolHandlers)
          toolResults.push(result)
          return {
            type: 'tool_result' as const,
            tool_use_id: tool.id,
            content: result,
          }
        })

        // Continue conversation with tool results
        const continueR = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: AI_MODEL,
            max_tokens: 1500,
            tools: AI_TOOLS,
            messages: [
              ...apiMessages,
              { role: 'assistant', content: data.content },
              { role: 'user', content: toolResultMessages },
            ],
          }),
        })

        data = await continueR.json()
      }

      // Extract final text response
      const finalText = (data.content || [])
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('')

      reply += finalText

      if (!reply && toolResults.length > 0) {
        reply = toolResults.join('\n')
      }

      setMessages((m) => [...m, { role: 'assistant', content: reply || 'Errore. Riprova.' }])
    } catch (err) {
      console.error('chat error', err)
      setMessages((m) => [...m, { role: 'assistant', content: 'Errore di connessione. Riprova.' }])
    }
    setLoading(false)
  }

  const suggestions = [
    'Come sto andando questa settimana?',
    'Cosa devo ottimizzare?',
    'Analizza le mie abitudini',
    'Cosa sto saltando di più?',
  ]

  return (
    <div className="pt-3.5 flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-semibold mb-1.5">Il tuo AI Coach</div>
            <div className="text-xs text-muted-2 mb-4">
              Ho accesso a tutti i tuoi dati: attività, streak, umore, journal. Posso anche spuntare attività, aggiungerne di nuove, e salvare note.
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
              ⏳ Sto analizzando...
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
          placeholder="Scrivimi qualcosa..."
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

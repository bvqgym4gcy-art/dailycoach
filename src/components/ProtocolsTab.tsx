import { useState } from 'react'
import type { ActiveProtocol, MoodProtocol } from '../types'
import { PROTOCOLS } from '../data/protocols'
import { dateKey, addDays } from '../lib/utils'

interface Props {
  activeProtocol: ActiveProtocol | null
  onActivate: (protocolId: string) => void
  onToggleRule: (date: string, ruleId: string) => void
  onDeactivate: () => void
}

export function ProtocolsTab({ activeProtocol, onActivate, onToggleRule, onDeactivate }: Props) {
  const [viewProtocol, setViewProtocol] = useState<MoodProtocol | null>(null)

  const today = dateKey(new Date())

  // Active protocol view
  if (activeProtocol) {
    const protocol = PROTOCOLS.find((p) => p.id === activeProtocol.protocolId)
    if (!protocol) return null

    const startDate = new Date(activeProtocol.startDate)
    const endDate = addDays(startDate, protocol.durationDays)
    const dayNumber = Math.floor((new Date().getTime() - startDate.getTime()) / 86400000) + 1
    const totalDays = protocol.durationDays
    const isComplete = dayNumber > totalDays

    // Calculate stats
    const allDays = Object.keys(activeProtocol.dailyLog)
    const totalChecks = allDays.reduce((sum, d) => {
      const dayLog = activeProtocol.dailyLog[d] || {}
      return sum + Object.values(dayLog).filter(Boolean).length
    }, 0)
    const totalPossible = allDays.length * protocol.rules.length
    const adherence = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0

    // Today's log
    const todayLog = activeProtocol.dailyLog[today] || {}

    // Streak
    let streak = 0
    for (let i = 0; i < totalDays; i++) {
      const d = dateKey(addDays(new Date(), -i))
      const log = activeProtocol.dailyLog[d]
      if (!log) break
      const allDone = protocol.rules.every((r) => log[r.id])
      if (allDone) streak++
      else break
    }

    return (
      <div className="pt-3.5">
        {/* Protocol header */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-2xl mb-1">{protocol.icon}</div>
              <div className="text-[15px] font-bold">{protocol.name}</div>
              <div className="text-[11px] text-muted-3 mt-1">{protocol.description}</div>
            </div>
            {isComplete && (
              <span className="text-[9px] bg-white text-black font-bold px-2 py-0.5 rounded-full shrink-0">COMPLETATO</span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-input-bg rounded-xl p-3 text-center">
              <div className="text-lg font-bold">{isComplete ? '✓' : `${dayNumber}/${totalDays}`}</div>
              <div className="text-[9px] text-muted-3">Giorno</div>
            </div>
            <div className="flex-1 bg-input-bg rounded-xl p-3 text-center">
              <div className="text-lg font-bold">{adherence}%</div>
              <div className="text-[9px] text-muted-3">Aderenza</div>
            </div>
            <div className="flex-1 bg-input-bg rounded-xl p-3 text-center">
              <div className="text-lg font-bold">🔥{streak}</div>
              <div className="text-[9px] text-muted-3">Streak</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-[#1a1a1a] rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (dayNumber / totalDays) * 100)}%` }} />
          </div>
          <div className="text-[10px] text-muted-3 mt-1 text-right">
            {dateKey(startDate)} → {dateKey(endDate)}
          </div>
        </div>

        {/* Today's checklist */}
        {!isComplete && (
          <>
            <div className="text-xs text-muted-2 uppercase tracking-widest mb-2">Oggi — Giorno {dayNumber}</div>
            {protocol.rules.map((rule) => {
              const checked = !!todayLog[rule.id]
              return (
                <div
                  key={rule.id}
                  onClick={() => onToggleRule(today, rule.id)}
                  className="bg-card border rounded-[13px] mb-[7px] p-3.5 flex items-center gap-3 cursor-pointer"
                  style={{ borderColor: checked ? '#333' : '#1a1a1a', opacity: checked ? 0.6 : 1 }}
                >
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px]"
                    style={{
                      border: `1.5px solid ${checked ? '#fff' : '#1f1f1f'}`,
                      background: checked ? '#fff' : 'transparent',
                      color: '#000',
                    }}
                  >
                    {checked ? '✓' : ''}
                  </div>
                  <span className="text-[14px] shrink-0">{rule.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium ${checked ? 'text-[#333] line-through' : 'text-white'}`}>
                      {rule.label}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-[1px] rounded-[4px] ${rule.type === 'do' ? 'text-muted-3 bg-[#111] border border-border' : 'text-[#666] bg-[#110808] border border-[#1a1010]'}`}>
                        {rule.type === 'do' ? 'FARE' : 'EVITARE'}
                      </span>
                      {rule.frequency === '3x_week' && (
                        <span className="text-[9px] text-muted-3 bg-[#111] border border-border px-1.5 py-[1px] rounded-[4px]">3x/sett</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Week view */}
        <div className="bg-card border border-border rounded-2xl p-4 mt-3">
          <div className="text-[11px] text-muted-2 uppercase tracking-widest mb-3">Ultimi 7 giorni</div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = dateKey(addDays(new Date(), -(6 - i)))
              const log = activeProtocol.dailyLog[d] || {}
              const done = Object.values(log).filter(Boolean).length
              const total = protocol.rules.length
              const pct = total > 0 ? done / total : 0
              const isToday = d === today
              return (
                <div key={i} className="flex-1 text-center">
                  <div
                    className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold mb-1"
                    style={{
                      background: pct >= 1 ? '#fff' : pct > 0 ? '#222' : '#111',
                      color: pct >= 1 ? '#000' : pct > 0 ? '#888' : '#333',
                      border: isToday ? '1px solid #fff' : '1px solid transparent',
                    }}
                  >
                    {pct >= 1 ? '✓' : done > 0 ? done : ''}
                  </div>
                  <div className={`text-[8px] ${isToday ? 'text-white' : 'text-muted-4'}`}>
                    {new Date(d).toLocaleDateString('it-IT', { weekday: 'narrow' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Deactivate */}
        <button
          onClick={onDeactivate}
          className="w-full mt-4 p-3 rounded-xl text-[12px] text-[#555] border border-[#1a1a1a] bg-transparent cursor-pointer"
        >
          Termina protocollo
        </button>
      </div>
    )
  }

  // Preview a protocol
  if (viewProtocol) {
    return (
      <div className="pt-3.5">
        <button onClick={() => setViewProtocol(null)} className="text-[11px] text-muted-3 mb-3 bg-transparent border-none cursor-pointer p-0">
          ← Protocolli
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{viewProtocol.icon}</div>
          <div className="text-xl font-bold">{viewProtocol.name}</div>
          <div className="text-[12px] text-muted-3 mt-2 leading-relaxed">{viewProtocol.description}</div>
          <div className="text-[11px] text-muted-2 mt-2">{viewProtocol.durationDays} giorni</div>
        </div>

        {/* Rules preview */}
        <div className="text-xs text-muted-2 uppercase tracking-widest mb-2">Regole del protocollo</div>
        {viewProtocol.rules.map((rule) => (
          <div key={rule.id} className="bg-card border border-border rounded-[13px] mb-[7px] p-3.5 flex items-center gap-3">
            <span className="text-[14px]">{rule.icon}</span>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-white">{rule.label}</div>
              <div className="flex gap-2 mt-0.5">
                <span className={`text-[9px] px-1.5 py-[1px] rounded-[4px] ${rule.type === 'do' ? 'text-muted-3 bg-[#111] border border-border' : 'text-[#666] bg-[#110808] border border-[#1a1010]'}`}>
                  {rule.type === 'do' ? 'FARE' : 'EVITARE'}
                </span>
                {rule.frequency === '3x_week' && (
                  <span className="text-[9px] text-muted-3 bg-[#111] border border-border px-1.5 py-[1px] rounded-[4px]">3x/sett</span>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => { onActivate(viewProtocol.id); setViewProtocol(null) }}
          className="w-full mt-4 p-4 bg-white border-none rounded-xl text-black text-[14px] font-bold cursor-pointer"
        >
          Attiva {viewProtocol.name}
        </button>
      </div>
    )
  }

  // Protocol list
  return (
    <div className="pt-3.5">
      <div className="text-xs text-muted-2 uppercase tracking-widest mb-3">Protocolli</div>
      <div className="text-[11px] text-muted-3 mb-4">Scegli un protocollo per trasformare le tue abitudini.</div>

      {PROTOCOLS.map((p) => (
        <button
          key={p.id}
          onClick={() => setViewProtocol(p)}
          className="w-full bg-card border border-border rounded-2xl p-4 mb-3 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{p.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-white">{p.name}</div>
              <div className="text-[11px] text-muted-3 mt-1">{p.description}</div>
              <div className="text-[10px] text-muted-4 mt-1">{p.durationDays} giorni · {p.rules.length} regole</div>
            </div>
            <span className="text-muted-3 text-[13px]">→</span>
          </div>
        </button>
      ))}
    </div>
  )
}

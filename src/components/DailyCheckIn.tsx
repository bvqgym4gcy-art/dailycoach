import { useState } from 'react'
import type { SportType, DailyCheckInData } from '../types'

interface Props {
  onComplete: (data: DailyCheckInData) => void
}

const SPORTS: { type: SportType; icon: string; label: string }[] = [
  { type: 'palestra', icon: '🏋️', label: 'Palestra' },
  { type: 'nuoto', icon: '🏊', label: 'Nuoto' },
  { type: 'corsa', icon: '🏃', label: 'Corsa' },
  { type: 'yoga', icon: '🧘', label: 'Yoga' },
]

export function DailyCheckIn({ onComplete }: Props) {
  const [step, setStep] = useState<'sport' | 'time'>('sport')
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null)
  const [time, setTime] = useState('09:00')

  function handleSportSelect(sport: SportType) {
    setSelectedSport(sport)
    setStep('time')
  }

  function handleSkip() {
    onComplete({ sport: 'skip' })
  }

  function handleConfirm() {
    if (!selectedSport) return
    onComplete({ sport: selectedSport, sportTime: time })
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center px-5">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl mb-2">☀️</div>
          <div className="text-lg font-bold">Buongiorno Stefano</div>
          <div className="text-[13px] text-muted-3 mt-1">Organizziamo la giornata</div>
        </div>

        {step === 'sport' && (
          <>
            <div className="text-[13px] text-muted-2 text-center mb-4">Che sport fai oggi?</div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {SPORTS.map((s) => (
                <button
                  key={s.type}
                  onClick={() => handleSportSelect(s.type)}
                  className="bg-card border border-border rounded-2xl p-5 text-center cursor-pointer"
                  style={{ transition: 'all 150ms' }}
                >
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-[13px] font-semibold text-white">{s.label}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSkip}
              className="w-full p-3.5 rounded-xl text-[13px] text-muted-3 bg-transparent border border-border cursor-pointer"
            >
              Oggi riposo — niente sport
            </button>
          </>
        )}

        {step === 'time' && selectedSport && (
          <>
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">{SPORTS.find((s) => s.type === selectedSport)?.icon}</div>
              <div className="text-[13px] text-muted-2">
                A che ora fai <span className="text-white font-semibold">{SPORTS.find((s) => s.type === selectedSport)?.label.toLowerCase()}</span> oggi?
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-card border border-border rounded-xl px-6 py-4 text-white text-2xl font-bold text-center"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('sport')}
                className="flex-1 p-3.5 bg-input-bg border border-input-border rounded-xl text-muted-1 text-[13px] cursor-pointer"
              >
                Indietro
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 p-3.5 bg-white border-none rounded-xl text-black text-[13px] font-semibold cursor-pointer"
              >
                Conferma
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

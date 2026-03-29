import { MOODS } from '../config'

interface Props {
  todayMood: number | undefined
  onSave: (v: number) => void
  onClose: () => void
}

export function MoodModal({ todayMood, onSave, onClose }: Props) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] bg-card border border-input-border rounded-t-[20px] p-6">
        <div className="text-[15px] font-bold mb-[3px]">Come ti senti oggi?</div>
        <div className="text-[11px] text-muted-2 mb-[18px]">L'AI usa il tuo umore per trovare pattern.</div>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.v}
              onClick={() => onSave(m.v)}
              className="flex-1 py-[13px] rounded-xl text-[22px] cursor-pointer"
              style={{
                background: todayMood === m.v ? '#fff' : '#111',
                border: `1px solid ${todayMood === m.v ? '#fff' : '#1a1a1a'}`,
              }}
            >
              {m.e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

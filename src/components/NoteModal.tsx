import type { Activity } from '../types'
import { fmtLong } from '../lib/utils'

interface Props {
  act: Activity
  curDate: Date
  draft: string
  setDraft: (s: string) => void
  onSave: () => void
  onClose: () => void
}

export function NoteModal({ act, curDate, draft, setDraft, onSave, onClose }: Props) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] bg-card border border-input-border rounded-t-[20px] p-6">
        <div className="text-sm font-bold mb-0.5">{act.title}</div>
        <div className="text-[10px] text-muted-2 mb-3.5">⏱{act.time} · {fmtLong(curDate)}</div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Come è andata?"
          rows={5}
          className="w-full bg-input-bg border border-input-border rounded-[10px] px-3 py-2.5 text-white text-sm mb-3 h-[120px]"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 p-3.5 bg-input-bg border border-input-border rounded-xl text-muted-1 text-sm cursor-pointer">
            Annulla
          </button>
          <button onClick={onSave} className="flex-1 p-3.5 bg-white border-none rounded-xl text-black text-sm font-semibold cursor-pointer">
            Salva
          </button>
        </div>
      </div>
    </div>
  )
}

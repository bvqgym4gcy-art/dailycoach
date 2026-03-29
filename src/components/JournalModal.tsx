interface Props {
  ck: string
  draft: string
  setDraft: (s: string) => void
  onSave: () => void
  onClose: () => void
}

export function JournalModal({ ck, draft, setDraft, onSave, onClose }: Props) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] bg-card border border-input-border rounded-t-[20px] p-6">
        <div className="text-[15px] font-bold mb-1">📓 Journal — {ck}</div>
        <div className="text-[11px] text-muted-2 mb-3.5">Come è andata oggi? Pensieri, riflessioni, cosa hai imparato.</div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Scrivi liberamente..."
          rows={7}
          className="w-full bg-input-bg border border-input-border rounded-[10px] px-3 py-2.5 text-white text-sm mb-3 h-[160px]"
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

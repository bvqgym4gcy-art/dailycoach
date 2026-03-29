interface Props {
  onConfirm: () => void
  onClose: () => void
}

export function DeleteModal({ onConfirm, onClose }: Props) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div onClick={(e) => e.stopPropagation()} className="bg-card border border-input-border rounded-[20px] p-6 mx-5 max-w-[300px] w-full">
        <div className="text-[15px] font-bold mb-1.5">Eliminare?</div>
        <div className="text-xs text-muted-3 mb-[18px]">Non può essere annullato.</div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 p-3.5 bg-input-bg border border-input-border rounded-xl text-muted-1 text-sm cursor-pointer">
            Annulla
          </button>
          <button onClick={onConfirm} className="flex-1 p-3.5 bg-white border-none rounded-xl text-black text-sm font-semibold cursor-pointer">
            Elimina
          </button>
        </div>
      </div>
    </div>
  )
}

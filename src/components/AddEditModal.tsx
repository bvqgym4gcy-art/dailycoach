import type { Activity } from '../types'
import { CATS } from '../config'

interface NewActState {
  time: string
  title: string
  category: Activity['category']
  duration: number
  streak: boolean
}

interface Props {
  editItem: Activity | null
  newAct: NewActState
  setNewAct: (fn: (n: NewActState) => NewActState) => void
  onSave: () => void
  onClose: () => void
}

export function AddEditModal({ editItem, newAct, setNewAct, onSave, onClose }: Props) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] bg-card border border-input-border rounded-t-[20px] p-6">
        <div className="text-[15px] font-bold mb-3.5">{editItem ? 'Modifica' : 'Nuova attività'}</div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">Orario</span>
            <input
              type="time"
              value={newAct.time}
              onChange={(e) => setNewAct((n) => ({ ...n, time: e.target.value }))}
              className="w-full bg-input-bg border border-input-border rounded-[10px] px-3 py-2.5 text-white text-sm"
            />
          </div>
          <div>
            <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">Durata (min)</span>
            <input
              type="number"
              value={newAct.duration}
              onChange={(e) => setNewAct((n) => ({ ...n, duration: parseInt(e.target.value) || 30 }))}
              className="w-full bg-input-bg border border-input-border rounded-[10px] px-3 py-2.5 text-white text-sm"
            />
          </div>
        </div>

        <div className="mb-3">
          <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">Nome</span>
          <input
            type="text"
            value={newAct.title}
            onChange={(e) => setNewAct((n) => ({ ...n, title: e.target.value }))}
            placeholder="es. Meditazione"
            className="w-full bg-input-bg border border-input-border rounded-[10px] px-3 py-2.5 text-white text-sm"
          />
        </div>

        <div className="mb-3">
          <span className="text-[11px] text-muted-2 uppercase tracking-widest mb-2 block">Categoria</span>
          <div className="flex gap-[5px] flex-wrap">
            {CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => setNewAct((n) => ({ ...n, category: cat }))}
                className="px-2.5 py-[5px] rounded-lg text-[11px] font-medium cursor-pointer"
                style={{
                  background: newAct.category === cat ? '#fff' : '#111',
                  color: newAct.category === cat ? '#000' : '#444',
                  border: `1px solid ${newAct.category === cat ? '#fff' : '#1f1f1f'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setNewAct((n) => ({ ...n, streak: !n.streak }))}
          className="w-full p-[11px] mb-3 rounded-[11px] text-xs font-medium cursor-pointer"
          style={{
            background: newAct.streak ? '#fff' : '#111',
            color: newAct.streak ? '#000' : '#444',
            border: `1px solid ${newAct.streak ? '#fff' : '#1f1f1f'}`,
          }}
        >
          🔥 {newAct.streak ? 'Streak attivo' : 'Attiva streak'}
        </button>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 p-3.5 bg-input-bg border border-input-border rounded-xl text-muted-1 text-sm cursor-pointer">
            Annulla
          </button>
          <button onClick={onSave} className="flex-1 p-3.5 bg-white border-none rounded-xl text-black text-sm font-semibold cursor-pointer">
            {editItem ? 'Salva' : 'Aggiungi'}
          </button>
        </div>
      </div>
    </div>
  )
}

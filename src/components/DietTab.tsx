import { useState } from 'react'
import {
  DIET_RULES,
  PRANZO, PRANZO_ALT,
  MERENDA, MERENDA_ALT, MERENDA_FRUTTA_ALT,
  CENA, CENA_ALT,
  RECIPES,
  WEEKLY_PLAN, DAY_NAMES,
  type Meal, type MealComponent, type MealVariant, type Recipe, type DietOption,
} from '../data/diet'

type Section = 'oggi' | 'settimana' | 'alternative' | 'ricette'

export function DietTab() {
  const [section, setSection] = useState<Section>('oggi')
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null)
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)

  const today = new Date()
  const dayIdx = (today.getDay() + 6) % 7 // 0=Mon
  const todayPlan = WEEKLY_PLAN[dayIdx]
  const dayName = DAY_NAMES[dayIdx]

  const sections: [Section, string][] = [
    ['oggi', 'Oggi'],
    ['settimana', 'Settimana'],
    ['alternative', 'Alternative'],
    ['ricette', 'Ricette'],
  ]

  return (
    <div className="pt-3.5">
      {/* Section tabs */}
      <div className="flex gap-[3px] mb-4">
        {sections.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setSection(v)}
            className={`flex-1 py-1.5 px-1 rounded-[9px] text-[11px] font-semibold cursor-pointer ${
              section === v
                ? 'bg-white text-black border border-white'
                : 'bg-transparent text-muted-3 border border-transparent'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── OGGI ── */}
      {section === 'oggi' && (
        <div>
          {/* Fasting status */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-3">
            <div className="text-xs font-semibold text-muted-1 mb-1">⏱ Digiuno Intermittente 16:8</div>
            <div className="text-[11px] text-muted-3 mb-2">Finestra alimentare: 14:00 – 22:00</div>
            <div className="text-[11px] text-muted-2">
              {today.getHours() < 14
                ? '🔒 Stai digiunando — solo acqua, tè, caffè senza zucchero'
                : today.getHours() < 22
                  ? '🍽 Finestra alimentare aperta'
                  : '🔒 Finestra chiusa — digiuno fino alle 14:00'}
            </div>
          </div>

          {/* Today's plan */}
          <div className="text-xs text-muted-2 uppercase tracking-widest mb-2">{dayName} — Il tuo piano</div>

          {/* Pranzo */}
          <MealCard
            icon="🥗"
            title="Pranzo"
            time="14:00"
            items={[
              todayPlan.pranzo.carb,
              todayPlan.pranzo.protein,
              todayPlan.pranzo.verdura,
              'Olio EVO 2 cucchiai (20g)',
            ]}
          />

          {/* Merenda */}
          <MealCard
            icon="🥣"
            title="Merenda"
            time="17:00"
            items={[todayPlan.merenda]}
          />

          {/* Cena */}
          <MealCard
            icon="🍽"
            title="Cena"
            time="20:00"
            items={[
              'Pane di grano duro 3 fette (90g)',
              todayPlan.cena.protein,
              todayPlan.cena.verdura,
              'Olio EVO 1.5 cucchiai (15g)',
            ]}
          />

          {/* Daily drinks */}
          <div className="bg-card border border-border rounded-2xl p-4 mt-3">
            <div className="text-xs font-semibold text-muted-1 mb-2">☕ Durante la giornata</div>
            {DIET_RULES.dailyDrinks.map((d) => (
              <div key={d.name} className="text-[12px] text-muted-3 mb-1">
                {d.name} — {d.qty}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SETTIMANA ── */}
      {section === 'settimana' && (
        <div>
          {WEEKLY_PLAN.map((day, i) => {
            const isToday = i === dayIdx
            const expanded = expandedMeal === DAY_NAMES[i]
            return (
              <div key={i} className="mb-2">
                <button
                  onClick={() => setExpandedMeal(expanded ? null : DAY_NAMES[i])}
                  className="w-full bg-card border rounded-2xl p-3.5 text-left cursor-pointer"
                  style={{ borderColor: isToday ? '#fff' : '#1a1a1a' }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      <span className={`text-[13px] font-semibold ${isToday ? 'text-white' : 'text-muted-3'}`}>
                        {DAY_NAMES[i]}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-3">{expanded ? '▾' : '▸'}</span>
                  </div>
                  {!expanded && (
                    <div className="text-[11px] text-muted-3 mt-1.5 truncate">
                      {day.pranzo.protein} · {day.cena.protein}
                    </div>
                  )}
                </button>
                {expanded && (
                  <div className="bg-card border border-border rounded-xl p-3 mt-1 ml-2 mr-2">
                    <MealLine icon="🥗" label="Pranzo 14:00" items={[day.pranzo.carb, day.pranzo.protein, day.pranzo.verdura]} />
                    <MealLine icon="🥣" label="Merenda 17:00" items={[day.merenda]} />
                    <MealLine icon="🍽" label="Cena 20:00" items={['Pane 90g', day.cena.protein, day.cena.verdura]} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── ALTERNATIVE ── */}
      {section === 'alternative' && (
        <div>
          <AlternativeSection meal={PRANZO} variants={PRANZO_ALT} />
          <div className="h-px bg-border my-4" />
          <AlternativeSection meal={MERENDA} variants={MERENDA_ALT} extraLabel="Frutta alternativa" extraOptions={MERENDA_FRUTTA_ALT} />
          <div className="h-px bg-border my-4" />
          <AlternativeSection meal={CENA} variants={CENA_ALT} />
        </div>
      )}

      {/* ── RICETTE ── */}
      {section === 'ricette' && (
        <div>
          {RECIPES.map((recipe, i) => (
            <RecipeCard
              key={i}
              recipe={recipe}
              expanded={expandedRecipe === i}
              onToggle={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function MealCard({ icon, title, time, items }: { icon: string; title: string; time: string; items: string[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-2">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[13px] font-semibold">
          {icon} {title}
        </div>
        <div className="text-[10px] text-muted-3 bg-input-bg border border-muted-6 px-2 py-0.5 rounded-md">
          {time}
        </div>
      </div>
      {items.map((item, i) => (
        <div key={i} className="text-[12px] text-muted-2 py-[3px] border-b border-[#111] last:border-0">
          {item}
        </div>
      ))}
    </div>
  )
}

function MealLine({ icon, label, items }: { icon: string; label: string; items: string[] }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="text-[11px] text-muted-2 font-semibold mb-1">{icon} {label}</div>
      {items.map((item, i) => (
        <div key={i} className="text-[11px] text-muted-3 ml-4 mb-px">{item}</div>
      ))}
    </div>
  )
}

function AlternativeSection({ meal, variants, extraLabel, extraOptions }: {
  meal: Meal
  variants: MealVariant[]
  extraLabel?: string
  extraOptions?: DietOption[]
}) {
  return (
    <div>
      <div className="text-xs font-bold text-white mb-3">{meal.name} — {meal.time}</div>
      {meal.note && <div className="text-[10px] text-muted-3 italic mb-3">{meal.note}</div>}

      {meal.components.map((comp) => (
        <ComponentBlock key={comp.label} comp={comp} />
      ))}

      {variants.length > 0 && (
        <div className="mt-3">
          {variants.map((v, i) => (
            <div key={i} className="bg-input-bg border border-border rounded-xl p-3 mb-2">
              <div className="text-[11px] font-semibold text-muted-2 mb-1">
                {v.name}
                {v.frequency && <span className="text-muted-3 font-normal ml-1">({v.frequency})</span>}
              </div>
              {v.components.map((c, j) => (
                <div key={j} className="text-[11px] text-muted-3 ml-2">
                  {c.item.name} — {c.item.qty}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {extraLabel && extraOptions && (
        <div className="mt-2">
          <div className="text-[11px] text-muted-2 font-semibold mb-1.5">{extraLabel}</div>
          <div className="grid grid-cols-2 gap-1">
            {extraOptions.map((opt, i) => (
              <div key={i} className="text-[10px] text-muted-3 bg-input-bg rounded-lg px-2 py-1.5">
                {opt.name} — {opt.qty}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ComponentBlock({ comp }: { comp: MealComponent }) {
  const [open, setOpen] = useState(false)

  if (comp.alternatives.length === 0) {
    return (
      <div className="mb-2">
        <div className="text-[11px] text-muted-2 font-semibold">{comp.label}</div>
        <div className="text-[12px] text-muted-3 ml-2">{comp.main.name} — {comp.main.qty}</div>
      </div>
    )
  }

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
      >
        <span className="text-[11px] text-muted-2 font-semibold">{comp.label}</span>
        <span className="text-[9px] text-muted-3">{open ? '▾' : '▸'} {comp.alternatives.length} alt.</span>
      </button>
      <div className="text-[12px] text-white ml-2 mt-0.5">{comp.main.name} — {comp.main.qty}</div>
      {open && (
        <div className="mt-1 ml-2 bg-input-bg rounded-lg p-2">
          {comp.alternatives.map((alt, i) => (
            <div key={i} className="flex justify-between text-[10px] py-[2px]">
              <span className="text-muted-3">{alt.name} — {alt.qty}</span>
              {alt.frequency === 'once_week' && <span className="text-muted-5 text-[8px]">1x/sett</span>}
              {alt.frequency === 'twice_week' && <span className="text-muted-5 text-[8px]">2x/sett</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, expanded, onToggle }: { recipe: Recipe; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left cursor-pointer bg-transparent border-none"
      >
        <div className="flex justify-between items-center">
          <div className="text-[13px] font-semibold text-white">{recipe.name}</div>
          <span className="text-[11px] text-muted-3">{expanded ? '▾' : '▸'}</span>
        </div>
        {!expanded && (
          <div className="text-[10px] text-muted-3 mt-1">
            {recipe.ingredients.length} ingredienti · Tap per dettagli
          </div>
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="text-[11px] text-muted-2 font-semibold mb-2 uppercase tracking-widest">Ingredienti</div>
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex justify-between text-[12px] py-[3px] border-b border-[#111] last:border-0">
              <span className="text-muted-3">{ing.name}</span>
              <span className="text-white font-medium">{ing.qty}</span>
            </div>
          ))}
          <div className="text-[11px] text-muted-2 font-semibold mt-4 mb-2 uppercase tracking-widest">Procedimento</div>
          <div className="text-[12px] text-muted-3 leading-relaxed">{recipe.procedure}</div>
        </div>
      )}
    </div>
  )
}

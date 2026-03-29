import type { Activity, DayMealPlan } from '../types'

export const AI_TOOLS = [
  {
    name: 'toggle_activity',
    description:
      "Spunta o de-spunta un'attività di oggi. Usa questo quando Stefano dice di aver fatto qualcosa o chiede di segnare un'attività come completata/non completata.",
    input_schema: {
      type: 'object' as const,
      properties: {
        activity_id: {
          type: 'number',
          description: "L'ID numerico dell'attività da spuntare/de-spuntare",
        },
        done: {
          type: 'boolean',
          description: 'true per segnare come fatto, false per de-spuntare',
        },
      },
      required: ['activity_id', 'done'],
    },
  },
  {
    name: 'add_activity',
    description:
      "Aggiunge una nuova attività alla giornata di oggi. Usa questo quando Stefano dice 'aggiungi X alle Y' o simile.",
    input_schema: {
      type: 'object' as const,
      properties: {
        time: { type: 'string', description: 'Orario in formato HH:MM' },
        title: { type: 'string', description: "Nome dell'attività" },
        category: {
          type: 'string',
          enum: ['salute', 'sport', 'lavoro', 'routine', 'sociale'],
          description: 'Categoria',
        },
        duration: { type: 'number', description: 'Durata in minuti' },
        streak: { type: 'boolean', description: 'Se conta per lo streak' },
      },
      required: ['time', 'title', 'category', 'duration'],
    },
  },
  {
    name: 'save_note',
    description:
      "Salva una nota su un'attività specifica. Usa questo quando Stefano vuole annotare qualcosa su un'attività.",
    input_schema: {
      type: 'object' as const,
      properties: {
        activity_id: {
          type: 'number',
          description: "L'ID dell'attività",
        },
        text: { type: 'string', description: 'Il testo della nota' },
      },
      required: ['activity_id', 'text'],
    },
  },
  {
    name: 'save_journal',
    description:
      'Salva il journal del giorno. Usa questo quando Stefano vuole scrivere una riflessione o nota del giorno.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'Il testo del journal' },
      },
      required: ['text'],
    },
  },
  {
    name: 'set_meal_plan',
    description:
      "Imposta il piano alimentare per uno o più giorni. Usa questo quando Stefano ti dà un piano alimentare (PDF, testo, ecc.) e ti chiede di applicarlo a un periodo. Chiama questo tool una volta per ogni giorno. I campi sono opzionali: imposta solo quelli presenti nel piano.",
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'La data in formato YYYY-MM-DD' },
        colazione: { type: 'string', description: 'Cosa mangiare a colazione (o nota digiuno)' },
        spuntino1: { type: 'string', description: 'Spuntino di metà mattina' },
        pranzo: { type: 'string', description: 'Cosa mangiare a pranzo con quantità' },
        spuntino2: { type: 'string', description: 'Spuntino pomeridiano' },
        merenda: { type: 'string', description: 'Merenda con quantità' },
        cena: { type: 'string', description: 'Cosa mangiare a cena con quantità' },
      },
      required: ['date'],
    },
  },
]

export interface ToolCall {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolHandlers {
  onToggle: (activityId: number, done: boolean) => string
  onAddActivity: (act: Omit<Activity, 'id'>) => string
  onSaveNote: (activityId: number, text: string) => string
  onSaveJournal: (text: string) => string
  onSetMealPlan: (date: string, plan: DayMealPlan) => string
}

export function handleToolCall(
  tool: ToolCall,
  handlers: ToolHandlers
): string {
  switch (tool.name) {
    case 'toggle_activity':
      return handlers.onToggle(
        tool.input.activity_id as number,
        tool.input.done as boolean
      )
    case 'add_activity':
      return handlers.onAddActivity({
        time: tool.input.time as string,
        title: tool.input.title as string,
        category: tool.input.category as Activity['category'],
        duration: tool.input.duration as number,
        streak: (tool.input.streak as boolean) ?? false,
      })
    case 'save_note':
      return handlers.onSaveNote(
        tool.input.activity_id as number,
        tool.input.text as string
      )
    case 'save_journal':
      return handlers.onSaveJournal(tool.input.text as string)
    case 'set_meal_plan': {
      const plan: DayMealPlan = {}
      if (tool.input.colazione) plan.colazione = tool.input.colazione as string
      if (tool.input.spuntino1) plan.spuntino1 = tool.input.spuntino1 as string
      if (tool.input.pranzo) plan.pranzo = tool.input.pranzo as string
      if (tool.input.spuntino2) plan.spuntino2 = tool.input.spuntino2 as string
      if (tool.input.merenda) plan.merenda = tool.input.merenda as string
      if (tool.input.cena) plan.cena = tool.input.cena as string
      return handlers.onSetMealPlan(tool.input.date as string, plan)
    }
    default:
      return `Tool sconosciuto: ${tool.name}`
  }
}

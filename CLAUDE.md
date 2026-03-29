# Daily Coach — Documentazione Tecnica

## Panoramica

Daily Coach è un'app di personal coaching giornaliero costruita per Stefano. Traccia abitudini, pillole, attività quotidiane, umore e journal, con un AI Coach integrato che può analizzare pattern e **eseguire azioni** (spuntare attività, aggiungerne di nuove, salvare note/journal).

**URL live:** https://dailycoach.vercel.app
**Repo:** github.com/bvqgym4gcy-art/dailycoach

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3.4 (tema B&W custom) |
| Database | Supabase (PostgreSQL) — REST API diretta |
| AI | Anthropic API (claude-sonnet-4-20250514) con tool_use |
| Hosting | Vercel (auto-deploy da GitHub main) |
| PWA | manifest.json + meta tags per iOS home screen |

---

## Struttura File

```
dailycoach/
├── index.html              # Entry point Vite
├── package.json
├── vite.config.ts
├── tailwind.config.js      # Colori custom: card, border, muted.1-9
├── tsconfig.json
├── .env                    # VITE_ANTHROPIC_API_KEY (non committato)
├── public/
│   └── manifest.json       # PWA manifest
└── src/
    ├── main.tsx            # Entry React
    ├── App.tsx             # State centrale, persist, action handlers
    ├── index.css           # Tailwind directives + custom styles
    ├── types.ts            # Interfacce TypeScript (Activity, AppData, etc.)
    ├── config.ts           # Chiavi Supabase, costanti (MOODS, CATS, DAYS_IT)
    ├── lib/
    │   ├── db.ts           # dbLoad() / dbSave() — REST calls a Supabase
    │   └── utils.ts        # dateKey, calcStreak, calcBest, calDays, etc.
    ├── data/
    │   └── activities.ts   # Template BASE, GCAL events, buildAll()
    ├── ai/
    │   ├── context.ts      # buildContext() — genera il prompt con dati reali
    │   └── tools.ts        # AI_TOOLS definitions + handleToolCall()
    └── components/
        ├── Header.tsx       # Header sticky + week strip + tab bar
        ├── HabitsTab.tsx    # Lista attività del giorno + journal
        ├── CalendarTab.tsx  # Calendario mensile + records 30gg
        ├── StatsTab.tsx     # Grafici 14gg, streak abitudini, umore
        ├── ChatTab.tsx      # Chat AI con tool use loop
        ├── AICoachTab.tsx   # Insight proattivi (3 bullet)
        ├── MoodModal.tsx    # Selettore emoji umore
        ├── NoteModal.tsx    # Nota su attività
        ├── JournalModal.tsx # Journal giornaliero
        ├── AddEditModal.tsx # Aggiungi/modifica attività
        └── DeleteModal.tsx  # Conferma eliminazione
```

---

## Database

**Supabase project ref:** `tnijyvhjzykraawnkcvy`
**URL:** `https://tnijyvhjzykraawnkcvy.supabase.co`

### Tabella `dailycoach`

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | TEXT PRIMARY KEY | Chiave utente (es. "stefano") |
| data | JSONB | Tutto lo stato dell'app |
| updated_at | TIMESTAMPTZ | Auto-aggiornato |

RLS abilitato con policy "Allow all".

### Struttura del campo `data` (JSONB)

```json
{
  "checks":  { "2026-03-28": { "101": true, "102": false } },
  "history": { "2026-03-28": { "completed": 8, "total": 14, "rate": 57 } },
  "notes":   { "2026-03-28_101": "nota testuale" },
  "moods":   { "2026-03-28": 4 },
  "acts":    { "2026-03-28": [ /* array Activity[] */ ] },
  "journal": { "2026-03-28": { "text": "...", "ts": "...", "rate": 57, "mood": 4 } }
}
```

### Salvataggio

- **Debounced** a 800ms dopo ogni modifica
- **Doppia protezione:** Supabase (primario) + localStorage `dc_backup` (fallback)
- Al caricamento: prima Supabase, poi fallback su localStorage

---

## Logica Core

### Template Attività

Le attività giornaliere vengono generate da `buildAll()` in `src/data/activities.ts`:
- **Range attivo:** 28 marzo 2026 → 30 aprile 2026
- **BASE template:** 11 attività (pillole + palestra + pasti) — si ripete ogni giorno nel range
- **DIET_MEALS:** dal 1 aprile 2026 i pasti generici (Pranzo leggero, Cena) vengono sostituiti con 3 attività dieta (Pranzo 14:00, Merenda 17:00, Cena 20:00) con streak attivo
- **GCAL:** eventi importati staticamente da Google Calendar (badge "cal", non modificabili)
- **TODAY_EXTRA:** 4 attività extra solo per il 28 marzo 2026
- Fuori dal range → giornata vuota

### Regole Check

- **Oggi:** spunta/de-spunta libera
- **Giorni passati:** sola lettura (toggle disabilitato)
- I dati non vengono mai cancellati

### Calcolo Streak

`calcStreak()` in `src/lib/utils.ts`:
- Conta i giorni consecutivi partendo da **ieri** all'indietro
- Un giorno conta se almeno una attività con `streak: true` è stata completata
- Giorni senza attività streak vengono **skippati** (non rompono la serie)

---

## AI Chat — Tool Use

La feature più importante. Implementata in `src/components/ChatTab.tsx` + `src/ai/`.

### Come funziona

1. L'utente scrive un messaggio
2. Il sistema costruisce un **contesto completo** (`buildContext()`) con:
   - Tutte le attività di oggi con stato fatto/saltato
   - Storico completamento ultimi 14 giorni
   - Attività più saltate (top 5)
   - Umore ultimi 7 giorni
   - Journal ultimi 7 giorni
   - Streak per ogni abitudine
   - Lista attività **con ID** (per i tool)
3. Si invia all'API Anthropic con **4 tool** definiti
4. Se l'AI usa un tool → viene eseguito localmente → il risultato torna all'AI
5. Loop fino a 3 iterazioni per azioni multiple

### Tool disponibili

| Tool | Descrizione | Input |
|------|-------------|-------|
| `toggle_activity` | Spunta/de-spunta attività | `activity_id`, `done` |
| `add_activity` | Aggiunge attività a oggi | `time`, `title`, `category`, `duration`, `streak` |
| `save_note` | Salva nota su attività | `activity_id`, `text` |
| `save_journal` | Salva journal del giorno | `text` |

### Esempi di comandi via chat

- "Ho preso la NAC" → AI usa `toggle_activity` per spuntarla
- "Aggiungi riunione alle 15 domani" → AI usa `add_activity`
- "Scrivi nel journal: oggi giornata produttiva" → AI usa `save_journal`

---

## Design System

**REGOLA INDEROGABILE: bianco e nero puro, zero colori.**

| Token | Valore | Uso |
|-------|--------|-----|
| bg-black | `#000000` | Sfondo principale |
| white | `#ffffff` | Testo principale, accent, selezione attiva |
| card | `#0d0d0d` | Background cards |
| border | `#1a1a1a` | Bordi cards |
| input-bg | `#111111` | Background input/bottoni secondari |
| input-border | `#222222` | Bordi input |
| muted.1 | `#666666` | Testo secondario (labels) |
| muted.2 | `#555555` | Testo terziario |
| muted.3 | `#444444` | Tab inattivi |
| muted.4 | `#333333` | Testo molto debole |
| muted.5 | `#2a2a2a` | Quasi invisibile |

**Font:** `-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`
**Check completato:** cerchio bianco con ✓ nero
**Attività completata:** testo barrato + opacità ridotta (NON rimossa dalla lista)

---

## Variabili d'Ambiente

| Variabile | Dove | Descrizione |
|-----------|------|-------------|
| `VITE_ANTHROPIC_API_KEY` | `.env` locale + Vercel Environment Variables | API key Anthropic per chat AI |

Le chiavi Supabase sono hardcoded in `src/config.ts` (anon key pubblica, sicura lato client con RLS).

---

## Comandi

```bash
npm run dev      # Dev server locale (http://localhost:5173)
npm run build    # Build produzione → dist/
npm run preview  # Preview del build locale
```

---

## Deploy

Il deploy è **automatico**:
1. Push su `main` in GitHub
2. Vercel rileva il push e lancia `npm run build`
3. Serve la cartella `dist/`
4. Live su https://dailycoach.vercel.app

### Setup Vercel (una tantum)

1. Vai su Vercel → Settings → Environment Variables
2. Aggiungi `VITE_ANTHROPIC_API_KEY` con la tua API key Anthropic
3. Redeploy

---

## Tab dell'App

| Tab | Contenuto |
|-----|-----------|
| **Habits** | Lista attività del giorno, toggle check, journal, add/edit/delete |
| **Calendar** | Calendario mensile con indicatori, records 30 giorni |
| **Stats** | Grafici 14gg, streak per abitudine, umore 7 giorni, summary cards |
| **Dieta** | Piano alimentare IF 16:8 — oggi, settimana, alternative, ricette |
| **Chat** | Chat con AI Coach — analisi + azioni (tool use) |
| **AI** | 3 insight proattivi generati su richiesta |

---

## Sezione Dieta

Basata sul piano del **Dott. Luca Musella** (Kairoo Studio di Nutrizione Clinica).
Dati in `src/data/diet.ts`, componente in `src/components/DietTab.tsx`.

### Digiuno Intermittente 16:8

- **Digiuno:** 22:00 → 14:00 (solo acqua, tè, caffè senza zucchero)
- **Finestra alimentare:** 14:00 → 22:00
- 3 pasti: Pranzo (14:00), Merenda (17:00), Cena (20:00)

### Sub-sezioni

| Sezione | Contenuto |
|---------|-----------|
| **Oggi** | Piano del giorno con stato digiuno live, 3 pasti dettagliati |
| **Settimana** | Piano 7 giorni pre-generato con varietà automatica |
| **Alternative** | Tutte le alternative per ogni componente (carb, proteine, verdure) con quantità e frequenze |
| **Ricette** | 4 ricette con ingredienti e procedimento |

### Attività Dieta nel template

Dal 1 aprile 2026, le attività "Pranzo leggero" e "Cena" vengono sostituite con:
- 🥗 Pranzo (dieta) — 14:00, streak attivo
- 🥣 Merenda (dieta) — 17:00, streak attivo
- 🍽 Cena (dieta) — 20:00, streak attivo

---

## Cose da NON fare

- Non aggiungere colori (niente viola, verde, blu — solo B&W)
- Non usare librerie UI (no shadcn, no MUI, no Chakra)
- Non cancellare dati esistenti su Supabase
- Non cambiare la logica streak/check
- Non modificare il template attività senza aggiornare `buildAll()`

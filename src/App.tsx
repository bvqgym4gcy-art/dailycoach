import { useState, useEffect, useCallback, useRef, type TouchEvent as ReactTouchEvent } from 'react'
import type { Activity, HistoryEntry, JournalEntry, ChatMessage, Tab, AppData, DayMealPlan, ScheduleRule, CalendarEvent } from './types'
import { dbLoad, dbSave } from './lib/db'
import { dateKey, todayKey, calcStreak, addDays } from './lib/utils'
import { buildAll, HABIT_LIST } from './data/activities'
import { MOODS } from './config'
import { mergeCalendarEvents } from './lib/calendarSync'
import { Header } from './components/Header'
import { HabitsTab } from './components/HabitsTab'
import { CalendarTab } from './components/CalendarTab'
import { StatsTab } from './components/StatsTab'
import { ChatTab } from './components/ChatTab'
import { AICoachTab } from './components/AICoachTab'
import { DietTab } from './components/DietTab'
import { LifeTab } from './components/LifeTab'
import { requestPermission, scheduleNotifications } from './lib/notifications'
import { applySmartSchedule, applyMoveRules, learnFromEdit, DEFAULT_RULES } from './lib/smartSchedule'
import { MoodModal } from './components/MoodModal'
import { JournalModal } from './components/JournalModal'
import { AddEditModal, type EditActState } from './components/AddEditModal'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('today')
  const [curDate, setCurDate] = useState(new Date())
  const [calMonth, setCalMonth] = useState(new Date())
  const [allActs, setAllActs] = useState<Record<string, Activity[]>>(() => buildAll())
  const [checks, setChecks] = useState<Record<string, Record<number, boolean>>>({})
  const [history, setHistory] = useState<Record<string, HistoryEntry>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [moods, setMoods] = useState<Record<string, number>>({})
  const [journal, setJournal] = useState<Record<string, JournalEntry>>({})
  const [mealPlans, setMealPlans] = useState<Record<string, DayMealPlan>>({})
  const [rules, setRules] = useState<ScheduleRule[]>(DEFAULT_RULES)
  const [saveStatus, setSaveStatus] = useState('')

  // Modal state
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Activity | null>(null)
  const emptyAct: EditActState = { date: '', time: '', title: '', category: 'routine', duration: 30, streak: false, note: '' }
  const [newAct, setNewAct] = useState<EditActState>(emptyAct)
  const [showMood, setShowMood] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [journalDraft, setJournalDraft] = useState('')

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load data: localStorage first (instant), then Supabase (background sync)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function applyBlob(b: any) {
      if (b.checks) setChecks(b.checks as typeof checks)
      if (b.history) setHistory(b.history as typeof history)
      if (b.notes) setNotes(b.notes as typeof notes)
      if (b.moods) setMoods(b.moods as typeof moods)
      if (b.mealPlans) setMealPlans(b.mealPlans as typeof mealPlans)
      if (b.rules) setRules(b.rules as ScheduleRule[])
      const mp = (b.mealPlans || {}) as Record<string, DayMealPlan>
      let acts: Record<string, Activity[]>
      if (b.acts) acts = buildAll(b.acts as Record<string, Activity[]>, mp)
      else acts = buildAll({}, mp)
      // Merge live calendar events from DB
      if (b.calendarEvents) {
        const merged = mergeCalendarEvents(b.calendarEvents as CalendarEvent[], acts)
        if (merged) acts = merged
      }
      setAllActs(acts)
      if (b.journal) setJournal(b.journal as typeof journal)
    }

    // Step 1: load from localStorage instantly
    const backup = localStorage.getItem('dc_backup')
    if (backup) {
      try {
        applyBlob(JSON.parse(backup))
      } catch (e) {
        console.error('backup parse error', e)
      }
    }
    setLoading(false)

    // Step 2: sync from Supabase in background (overwrites if newer)
    dbLoad()
      .then((blob) => {
        if (blob) applyBlob(blob)
      })
      .catch((e) => console.error('dbLoad error', e))
  }, [])

  const persist = useCallback(
    (c: typeof checks, h: typeof history, n: typeof notes, m: typeof moods, a: typeof allActs, j: typeof journal, mp?: typeof mealPlans, r?: typeof rules) => {
      setSaveStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const blob: AppData = { checks: c, history: h, notes: n, moods: m, acts: a, journal: j, mealPlans: mp || mealPlans, rules: r || rules }
        localStorage.setItem('dc_backup', JSON.stringify(blob))
        dbSave(blob).then(() => {
          setSaveStatus('✓')
          setTimeout(() => setSaveStatus(''), 2000)
        })
      }, 800)
    },
    []
  )

  // Derived state
  const ck = dateKey(curDate)
  const dayActs = [...(allActs[ck] || [])].sort((a, b) => a.time.localeCompare(b.time))
  const dayChecks = checks[ck] || {}
  const done = dayActs.filter((a) => dayChecks[a.id]).length
  const total = dayActs.length
  const rate = total ? Math.round((done / total) * 100) : 0
  const streak = calcStreak(allActs, checks)
  const todayMood = moods[ck]
  const isToday = ck === todayKey()

  // Request notification permission on first load, schedule for today
  useEffect(() => {
    requestPermission().then((granted) => {
      if (granted) {
        const tk = todayKey()
        const todayActs = [...(allActs[tk] || [])].sort((a, b) => a.time.localeCompare(b.time))
        scheduleNotifications(todayActs, checks[tk] || {})
      }
    })
  }, [allActs, checks])

  // Actions
  function toggle(id: number) {
    if (!isToday) return
    const wasChecked = !!(checks[ck] || {})[id]
    const isChecking = !wasChecked
    const nc = { ...checks, [ck]: { ...(checks[ck] || {}), [id]: isChecking } }

    // Smart scheduling: if checking an anchor, shift dependents
    let na = allActs
    let nr = rules
    const smartResult = applySmartSchedule(id, isChecking, allActs[ck] || [], rules)
    if (smartResult) {
      na = { ...allActs, [ck]: smartResult.acts }
      nr = smartResult.rules
      setAllActs(na)
      setRules(nr)
    }

    const acts = na[ck] || []
    const d2 = acts.filter((a) => nc[ck][a.id]).length
    const nh = { ...history, [ck]: { completed: d2, total: acts.length, rate: acts.length ? Math.round((d2 / acts.length) * 100) : 0 } }
    setChecks(nc)
    setHistory(nh)
    persist(nc, nh, notes, moods, na, journal, undefined, nr)
  }

  function saveAct() {
    if (!newAct.title || !newAct.time) return
    const targetDate = newAct.date || ck
    const actData = { time: newAct.time, title: newAct.title, category: newAct.category, duration: newAct.duration, streak: newAct.streak }
    let na = { ...allActs }
    let nn = { ...notes }

    if (editItem) {
      // Editing existing — check if date changed
      if (targetDate !== ck) {
        // Move to different day: remove from current, add to target
        na[ck] = (na[ck] || []).filter((x) => x.id !== editItem.id)
        na[targetDate] = [...(na[targetDate] || []), { ...editItem, ...actData }]
        // Move note if exists
        const oldNoteKey = `${ck}_${editItem.id}`
        const newNoteKey = `${targetDate}_${editItem.id}`
        if (nn[oldNoteKey]) {
          nn[newNoteKey] = nn[oldNoteKey]
          delete nn[oldNoteKey]
        }
      } else {
        na[ck] = (na[ck] || []).map((x) => (x.id === editItem.id ? { ...editItem, ...actData } : x))
      }

      // Smart chain: if time changed, shift dependents + learn
      if (editItem.time !== newAct.time) {
        // First: learn if user is correcting an auto-shifted dependent
        const learnedRules = learnFromEdit(editItem, newAct.time, na[targetDate] || [], rules)
        if (learnedRules) {
          setRules(learnedRules)
        }
        // Then: apply move rules if this is an anchor
        const moveResult = applyMoveRules(editItem, newAct.time, na[targetDate] || [], learnedRules || rules)
        if (moveResult) {
          na[targetDate] = moveResult.acts
        }
      }

      // Save note
      const noteKey = `${targetDate}_${editItem.id}`
      if (newAct.note.trim()) {
        nn[noteKey] = newAct.note
      } else {
        delete nn[noteKey]
      }
    } else {
      // New activity
      const newId = Date.now()
      na[targetDate] = [...(na[targetDate] || []), { ...actData, id: newId } as Activity]
      if (newAct.note.trim()) {
        nn[`${targetDate}_${newId}`] = newAct.note
      }
    }

    setAllActs(na)
    setNotes(nn)
    setShowAdd(false)
    setEditItem(null)
    setNewAct(emptyAct)
    persist(checks, history, nn, moods, na, journal, undefined, rules)
  }

  function delAct(id: number) {
    const na = { ...allActs, [ck]: (allActs[ck] || []).filter((x) => x.id !== id) }
    setAllActs(na)
    setShowAdd(false)
    setEditItem(null)
    setNewAct(emptyAct)
    persist(checks, history, notes, moods, na, journal)
  }

  function reorderActs(fromIdx: number, toIdx: number) {
    const list = [...(allActs[ck] || [])]
    const sorted = [...list].sort((a, b) => a.time.localeCompare(b.time))
    const [moved] = sorted.splice(fromIdx, 1)
    sorted.splice(toIdx, 0, moved)
    const na = { ...allActs, [ck]: sorted }
    setAllActs(na)
    persist(checks, history, notes, moods, na, journal)
  }

  function saveMood(v: number) {
    const nm = { ...moods, [ck]: v }
    setMoods(nm)
    setShowMood(false)
    persist(checks, history, notes, nm, allActs, journal)
  }


  function saveJournalEntry() {
    if (!journalDraft.trim()) return
    const entry: JournalEntry = {
      text: journalDraft,
      ts: new Date().toISOString(),
      rate,
      done,
      total,
      mood: todayMood || null,
    }
    const newJournal = { ...journal, [ck]: entry }
    setJournal(newJournal)
    persist({ ...checks }, { ...history }, { ...notes }, { ...moods }, allActs, newJournal)
    setJournalDraft('')
    setShowJournal(false)
  }

  // AI action handlers (called from ChatTab when AI uses tools)
  function aiToggle(activityId: number, done: boolean): string {
    if (!isToday) return 'Errore: puoi modificare solo le attività di oggi.'
    const act = dayActs.find((a) => a.id === activityId)
    if (!act) return `Errore: attività con ID ${activityId} non trovata.`
    const nc = { ...checks, [ck]: { ...(checks[ck] || {}), [activityId]: done } }
    const acts = allActs[ck] || []
    const d2 = acts.filter((a) => nc[ck][a.id]).length
    const nh = { ...history, [ck]: { completed: d2, total: acts.length, rate: acts.length ? Math.round((d2 / acts.length) * 100) : 0 } }
    setChecks(nc)
    setHistory(nh)
    persist(nc, nh, notes, moods, allActs, journal)
    return `${done ? '✓' : '✗'} "${act.title}" ${done ? 'segnata come fatta' : 'de-spuntata'}.`
  }

  function aiAddActivity(act: Omit<Activity, 'id'>): string {
    const newActivity: Activity = { ...act, id: Date.now() }
    const na = { ...allActs, [ck]: [...(allActs[ck] || []), newActivity] }
    setAllActs(na)
    persist(checks, history, notes, moods, na, journal)
    return `Aggiunta: "${act.title}" alle ${act.time}.`
  }

  function aiSaveNote(activityId: number, text: string): string {
    const act = dayActs.find((a) => a.id === activityId)
    if (!act) return `Errore: attività con ID ${activityId} non trovata.`
    const nn = { ...notes, [`${ck}_${activityId}`]: text }
    setNotes(nn)
    persist(checks, history, nn, moods, allActs, journal)
    return `Nota salvata su "${act.title}".`
  }

  function aiSaveJournal(text: string): string {
    const entry: JournalEntry = {
      text,
      ts: new Date().toISOString(),
      rate,
      done,
      total,
      mood: todayMood || null,
    }
    const newJournal = { ...journal, [ck]: entry }
    setJournal(newJournal)
    persist({ ...checks }, { ...history }, { ...notes }, { ...moods }, allActs, newJournal)
    return 'Journal salvato.'
  }

  function aiSetMealPlan(date: string, plan: DayMealPlan): string {
    const newPlans = { ...mealPlans, [date]: { ...(mealPlans[date] || {}), ...plan } }
    setMealPlans(newPlans)
    // Rebuild activities for this day with new meal plan
    const newActs = { ...allActs }
    delete newActs[date] // force rebuild
    const rebuilt = buildAll(newActs, newPlans)
    setAllActs(rebuilt)
    persist(checks, history, notes, moods, rebuilt, journal, newPlans)
    const parts = [plan.colazione, plan.pranzo, plan.merenda, plan.cena].filter(Boolean)
    return `Piano pasto per ${date} impostato: ${parts.join(', ')}`
  }

  // Swipe to change day
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)
  const swiping = useRef(false)

  function onTouchStart(e: ReactTouchEvent) {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
    swiping.current = true
  }

  function onTouchEnd(e: ReactTouchEvent) {
    if (!swiping.current) return
    swiping.current = false
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    const dy = e.changedTouches[0].clientY - swipeStartY.current
    // Only trigger if horizontal swipe > 80px and more horizontal than vertical
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        // Swipe left → next day
        setCurDate(addDays(curDate, 1))
      } else {
        // Swipe right → previous day
        setCurDate(addDays(curDate, -1))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-3xl">⏳</div>
        <div className="text-sm text-muted-2">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white max-w-[480px] mx-auto">
      <Header
        tab={tab}
        setTab={setTab}
        curDate={curDate}
        setCurDate={setCurDate}
        ck={ck}
        history={history}
        streak={streak}
        todayMood={todayMood}
        saveStatus={saveStatus}
        onMoodClick={() => setShowMood(true)}
        isToday={isToday}
      />

      <div className="px-5 pb-[100px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {tab === 'today' && (
          <HabitsTab
            curDate={curDate}
            setCurDate={setCurDate}
            dayActs={dayActs}
            dayChecks={dayChecks}
            done={done}
            total={total}
            rate={rate}
            isToday={isToday}
            ck={ck}
            notes={notes}
            journal={journal}
            history={history}
            onToggle={toggle}
            onEdit={(act) => { setEditItem(act); setNewAct({ date: ck, time: act.time, title: act.title, category: act.category, duration: act.duration, streak: !!act.streak, note: notes[`${ck}_${act.id}`] || '' }); setShowAdd(true) }}
            onAdd={() => { setShowAdd(true); setEditItem(null); setNewAct({ ...emptyAct, date: ck }) }}
            onJournal={() => { setJournalDraft(journal[ck]?.text || ''); setShowJournal(true) }}
            onReorder={reorderActs}
          />
        )}

        {tab === 'calendar' && (
          <CalendarTab
            calMonth={calMonth}
            setCalMonth={setCalMonth}
            ck={ck}
            history={history}
            streak={streak}
            allActs={allActs}
            checks={checks}
            onSelectDate={(d) => { setCurDate(d); setTab('today') }}
          />
        )}

        {tab === 'stats' && (
          <StatsTab
            rate={rate}
            done={done}
            total={total}
            streak={streak}
            history={history}
            moods={moods}
            allActs={allActs}
            checks={checks}
          />
        )}

        {tab === 'diet' && <DietTab />}

        {tab === 'life' && <LifeTab />}

        {tab === 'chat' && (
          <ChatTab
            ck={ck}
            dayActs={dayActs}
            dayChecks={dayChecks}
            checks={checks}
            allActs={allActs}
            history={history}
            moods={moods}
            journal={journal}
            messages={chatMessages}
            setMessages={setChatMessages}
            toolHandlers={{
              onToggle: aiToggle,
              onAddActivity: aiAddActivity,
              onSaveNote: aiSaveNote,
              onSaveJournal: aiSaveJournal,
              onSetMealPlan: aiSetMealPlan,
            }}
          />
        )}

        {tab === 'ai' && (
          <AICoachTab
            ck={ck}
            dayActs={dayActs}
            dayChecks={dayChecks}
            checks={checks}
            allActs={allActs}
            history={history}
            moods={moods}
            journal={journal}
          />
        )}
      </div>

      {/* FAB — add activity */}
      <button
        onClick={() => { setShowAdd(true); setEditItem(null); setNewAct({ ...emptyAct, date: ck }) }}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white text-black text-2xl font-light flex items-center justify-center shadow-lg cursor-pointer z-30 border-none"
        style={{ maxWidth: 480, lineHeight: 1 }}
      >
        +
      </button>

      {showMood && <MoodModal todayMood={todayMood} onSave={saveMood} onClose={() => setShowMood(false)} />}
      {showJournal && <JournalModal ck={ck} draft={journalDraft} setDraft={setJournalDraft} onSave={saveJournalEntry} onClose={() => setShowJournal(false)} />}
      {showAdd && <AddEditModal editItem={editItem} newAct={newAct} setNewAct={setNewAct} onSave={saveAct} onDelete={editItem ? () => delAct(editItem.id) : null} onClose={() => { setShowAdd(false); setEditItem(null) }} />}
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Activity, HistoryEntry, JournalEntry, ChatMessage, Tab, AppData } from './types'
import { dbLoad, dbSave } from './lib/db'
import { dateKey, todayKey, calcStreak, calcBest, getWeekDates } from './lib/utils'
import { buildAll, HABIT_LIST } from './data/activities'
import { MOODS } from './config'
import { Header } from './components/Header'
import { HabitsTab } from './components/HabitsTab'
import { CalendarTab } from './components/CalendarTab'
import { StatsTab } from './components/StatsTab'
import { ChatTab } from './components/ChatTab'
import { AICoachTab } from './components/AICoachTab'
import { DietTab } from './components/DietTab'
import { MoodModal } from './components/MoodModal'
import { NoteModal } from './components/NoteModal'
import { JournalModal } from './components/JournalModal'
import { AddEditModal } from './components/AddEditModal'
import { DeleteModal } from './components/DeleteModal'

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
  const [saveStatus, setSaveStatus] = useState('')

  // Modal state
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Activity | null>(null)
  const [newAct, setNewAct] = useState({ time: '', title: '', category: 'routine' as Activity['category'], duration: 30, streak: false })
  const [delId, setDelId] = useState<number | null>(null)
  const [noteAct, setNoteAct] = useState<Activity | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [showMood, setShowMood] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [journalDraft, setJournalDraft] = useState('')

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load data
  useEffect(() => {
    dbLoad()
      .then((blob) => {
        if (blob) {
          if (blob.checks) setChecks(blob.checks)
          if (blob.history) setHistory(blob.history)
          if (blob.notes) setNotes(blob.notes)
          if (blob.moods) setMoods(blob.moods)
          if (blob.acts) setAllActs(buildAll(blob.acts))
          if (blob.journal) setJournal(blob.journal)
        } else {
          const backup = localStorage.getItem('dc_backup')
          if (backup) {
            try {
              const b = JSON.parse(backup)
              if (b.checks) setChecks(b.checks)
              if (b.history) setHistory(b.history)
              if (b.notes) setNotes(b.notes)
              if (b.moods) setMoods(b.moods)
              if (b.acts) setAllActs(buildAll(b.acts))
              if (b.journal) setJournal(b.journal)
            } catch (e) {
              console.error('backup parse error', e)
            }
          }
        }
        setLoading(false)
      })
      .catch((e) => {
        console.error('dbLoad error', e)
        setLoading(false)
      })
  }, [])

  const persist = useCallback(
    (c: typeof checks, h: typeof history, n: typeof notes, m: typeof moods, a: typeof allActs, j: typeof journal) => {
      setSaveStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const blob: AppData = { checks: c, history: h, notes: n, moods: m, acts: a, journal: j }
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
  const weekDates = getWeekDates(curDate)

  // Actions
  function toggle(id: number) {
    if (!isToday) return
    const nc = { ...checks, [ck]: { ...(checks[ck] || {}), [id]: !(checks[ck] || {})[id] } }
    const acts = allActs[ck] || []
    const d2 = acts.filter((a) => nc[ck][a.id]).length
    const nh = { ...history, [ck]: { completed: d2, total: acts.length, rate: acts.length ? Math.round((d2 / acts.length) * 100) : 0 } }
    setChecks(nc)
    setHistory(nh)
    persist(nc, nh, notes, moods, allActs, journal)
  }

  function saveAct() {
    if (!newAct.title || !newAct.time) return
    const list = [...(allActs[ck] || [])]
    const updated = editItem
      ? list.map((x) => (x.id === editItem.id ? { ...editItem, ...newAct } : x))
      : [...list, { ...newAct, id: Date.now() } as Activity]
    const na = { ...allActs, [ck]: updated }
    setAllActs(na)
    setShowAdd(false)
    setEditItem(null)
    setNewAct({ time: '', title: '', category: 'routine', duration: 30, streak: false })
    persist(checks, history, notes, moods, na, journal)
  }

  function delAct(id: number) {
    const na = { ...allActs, [ck]: (allActs[ck] || []).filter((x) => x.id !== id) }
    setAllActs(na)
    setDelId(null)
    persist(checks, history, notes, moods, na, journal)
  }

  function saveMood(v: number) {
    const nm = { ...moods, [ck]: v }
    setMoods(nm)
    setShowMood(false)
    persist(checks, history, notes, nm, allActs, journal)
  }

  function saveNote() {
    if (!noteAct) return
    const nn = { ...notes, [`${ck}_${noteAct.id}`]: noteDraft }
    setNotes(nn)
    setNoteAct(null)
    persist(checks, history, nn, moods, allActs, journal)
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
        weekDates={weekDates}
        ck={ck}
        history={history}
        streak={streak}
        todayMood={todayMood}
        saveStatus={saveStatus}
        onMoodClick={() => setShowMood(true)}
        isToday={isToday}
      />

      <div className="px-5 pb-[100px]">
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
            onToggle={toggle}
            onNote={(act) => { setNoteAct(act); setNoteDraft(notes[`${ck}_${act.id}`] || '') }}
            onEdit={(act) => { setEditItem(act); setNewAct({ time: act.time, title: act.title, category: act.category, duration: act.duration, streak: !!act.streak }); setShowAdd(true) }}
            onDelete={(id) => setDelId(id)}
            onAdd={() => { setShowAdd(true); setEditItem(null); setNewAct({ time: '', title: '', category: 'routine', duration: 30, streak: false }) }}
            onJournal={() => { setJournalDraft(journal[ck]?.text || ''); setShowJournal(true) }}
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

      {showMood && <MoodModal todayMood={todayMood} onSave={saveMood} onClose={() => setShowMood(false)} />}
      {noteAct && <NoteModal act={noteAct} curDate={curDate} draft={noteDraft} setDraft={setNoteDraft} onSave={saveNote} onClose={() => setNoteAct(null)} />}
      {showJournal && <JournalModal ck={ck} draft={journalDraft} setDraft={setJournalDraft} onSave={saveJournalEntry} onClose={() => setShowJournal(false)} />}
      {showAdd && <AddEditModal editItem={editItem} newAct={newAct} setNewAct={setNewAct} onSave={saveAct} onClose={() => { setShowAdd(false); setEditItem(null) }} />}
      {delId !== null && <DeleteModal onConfirm={() => delAct(delId)} onClose={() => setDelId(null)} />}
    </div>
  )
}

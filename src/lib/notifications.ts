import type { Activity } from '../types'

let scheduledTimers: ReturnType<typeof setTimeout>[] = []

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getPermissionState(): string {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function scheduleNotifications(
  dayActs: Activity[],
  dayChecks: Record<number, boolean>
) {
  // Clear previous
  clearNotifications()

  if (Notification.permission !== 'granted') return

  const now = new Date()

  dayActs.forEach((act) => {
    if (dayChecks[act.id]) return // Already done

    const [h, m] = act.time.split(':').map(Number)
    const target = new Date(now)
    target.setHours(h, m, 0, 0)

    const delay = target.getTime() - now.getTime()

    // Only schedule if in the future (and within 24h)
    if (delay > 0 && delay < 86400000) {
      const timer = setTimeout(() => {
        new Notification('Daily Coach', {
          body: `⏰ ${act.time} — ${act.title}`,
          icon: '/manifest.json',
          tag: `act-${act.id}`,
          silent: false,
        })
      }, delay)
      scheduledTimers.push(timer)
    }
  })
}

export function clearNotifications() {
  scheduledTimers.forEach(clearTimeout)
  scheduledTimers = []
}

import { SUPA_URL, SUPA_KEY, USER_ID } from '../config'
import type { AppData } from '../types'

export async function dbLoad(): Promise<AppData | null> {
  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/dailycoach?id=eq.${USER_ID}&select=data`,
      {
        headers: {
          apikey: SUPA_KEY,
          Authorization: `Bearer ${SUPA_KEY}`,
        },
      }
    )
    const rows = await r.json()
    if (rows && rows[0]) return rows[0].data
  } catch (e) {
    console.error('load error', e)
  }
  return null
}

export async function dbSave(data: AppData): Promise<void> {
  try {
    await fetch(`${SUPA_URL}/rest/v1/dailycoach`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: USER_ID,
        data,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch (e) {
    console.error('save error', e)
  }
}

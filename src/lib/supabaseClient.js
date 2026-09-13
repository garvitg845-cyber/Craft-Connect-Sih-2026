import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function callEdgeFunction(name, body, timeoutMs = 100000) {
  const { data: { session } } = await supabase.auth.getSession()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const raw = await res.text()
    let json = {}
    try { json = raw ? JSON.parse(raw) : {} } catch { json = { error: raw || 'Invalid response from Edge Function' } }
    if (!res.ok) {
      const detail = json.detail ? ` — ${String(json.detail).slice(0, 500)}` : ''
      throw new Error(`${json.error || 'Edge function request failed'}${detail}`)
    }
    return json
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`${name} timed out after ${Math.round(timeoutMs / 1000)} seconds. Try a smaller photo or try again.`)
    throw error
  } finally {
    clearTimeout(timer)
  }
}

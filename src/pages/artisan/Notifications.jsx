import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_NOTIFICATIONS } from '../../lib/demoData'

export default function Notifications() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setNotifs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold">Notifications</h1>{notifs.length === 0 && <DemoBadge />}</div>
      {notifs.length === 0 ? (
        <><DemoNotice className="mb-5" /><div className="space-y-2">{DEMO_NOTIFICATIONS.map((n) => <div key={n.id} className={`card ${!n.is_read ? 'border-craft-orange' : ''}`}><p className="font-medium text-sm">{n.title}</p><p className="text-sm text-gray-500">{n.body}</p><p className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleString('en-IN')}</p></div>)}</div></>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} onClick={() => markRead(n.id)} className={`card cursor-pointer ${!n.is_read ? 'border-craft-orange' : ''}`}>
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-sm text-gray-500">{n.body}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

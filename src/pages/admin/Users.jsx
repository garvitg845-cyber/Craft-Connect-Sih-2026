import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_USERS } from '../../lib/demoData'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => { setUsers(data ?? []); setLoading(false) })
  }, [])

  const isDemo = users.length === 0
  const displayUsers = isDemo ? DEMO_USERS : users
  const filtered = filter ? displayUsers.filter((u) => u.role === filter) : displayUsers
  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-3"><h1 className="text-2xl font-bold">Users</h1>{isDemo && <DemoBadge />}</div><select className="input-field w-40" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All roles</option><option value="customer">Customer</option><option value="artisan">Artisan</option><option value="admin">Admin</option></select></div>
      {isDemo && <DemoNotice className="mb-5" />}
      {filtered.length === 0 ? <EmptyState title="No users found" /> : <div className="space-y-2">{filtered.map((u) => <div key={u.id} className="card flex justify-between items-center"><div><p className="font-medium">{u.full_name}</p><p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 capitalize font-medium">{u.role}</span></div>)}</div>}
    </div>
  )
}

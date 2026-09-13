import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_MODERATION } from '../../lib/demoData'

export default function ProductModeration() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('products').select('*, artisans(business_name)').eq('status', 'pending_review').order('created_at')
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function decide(id, status) {
    const notes = status === 'rejected' ? prompt('Reason for rejection:') : null
    const { error } = await supabase.from('products').update({ status, moderation_notes: notes }).eq('id', id)
    if (error) return toast.error(error.message)
    await supabase.from('audit_logs').insert({ actor_id: user.id, action: `product_${status}`, target_table: 'products', target_id: id, details: { notes } })
    toast.success(`Product ${status}`)
    load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold">Product Moderation</h1>{products.length === 0 && <DemoBadge />}</div>
      {products.length === 0 ? (
        <><DemoNotice className="mb-5" /><div className="space-y-3">{DEMO_MODERATION.map((p) => <div key={p.id} className="card flex items-center justify-between"><div><p className="font-medium">{p.title}</p><p className="text-sm text-gray-500">by {p.artisan} · ₹{p.price.toLocaleString('en-IN')}</p></div><span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">pending review</span></div>)}</div></>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-gray-500">by {p.artisans?.business_name} · ₹{p.price}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(p.id, 'approved')} className="text-sm text-green-600 font-medium">Approve</button>
                <button onClick={() => decide(p.id, 'rejected')} className="text-sm text-red-600 font-medium">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

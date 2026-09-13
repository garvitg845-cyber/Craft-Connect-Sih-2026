import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Returns() {
  const { user } = useAuth()
  const [orderItems, setOrderItems] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const { data: items } = await supabase
      .from('order_items')
      .select('id, products(title), orders!inner(customer_id)')
      .eq('orders.customer_id', user.id)
    const { data: existingReturns } = await supabase
      .from('returns')
      .select('*, order_items(products(title))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setOrderItems(items ?? [])
    setReturns(existingReturns ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function submitReturn(e) {
    e.preventDefault()
    if (!selected || !reason) return toast.error('Select an item and provide a reason')
    setSubmitting(true)
    try {
      let evidenceUrls = []
      if (file) {
        const path = `${user.id}/${Date.now()}_${file.name}`
        const { error: upErr } = await supabase.storage.from('return-evidence').upload(path, file)
        if (upErr) throw upErr
        evidenceUrls = [path]
      }
      const { error } = await supabase.from('returns').insert({
        order_item_id: selected,
        customer_id: user.id,
        reason,
        evidence_urls: evidenceUrls,
      })
      if (error) throw error
      toast.success('Return request submitted')
      setReason(''); setSelected(''); setFile(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Request a Return</h1>
        {orderItems.length === 0 ? (
          <EmptyState title="No items eligible for return yet" subtitle="You need a delivered order first." />
        ) : (
          <form onSubmit={submitReturn} className="card space-y-3">
            <select className="input-field" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select item</option>
              {orderItems.map((i) => <option key={i.id} value={i.id}>{i.products?.title}</option>)}
            </select>
            <textarea className="input-field" placeholder="Reason for return / damage description" value={reason} onChange={(e) => setReason(e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Return Request'}</button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your Return Requests</h2>
        {returns.length === 0 ? (
          <p className="text-sm text-gray-400">No return requests yet.</p>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => (
              <div key={r.id} className="card">
                <p className="font-medium text-sm">{r.order_items?.products?.title}</p>
                <p className="text-xs text-gray-500">{r.reason}</p>
                <p className="text-xs mt-1 font-medium capitalize text-tech-teal">{r.status.replace(/_/g, ' ')}</p>
                {r.admin_notes && <p className="text-xs text-gray-400 mt-1">Admin note: {r.admin_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

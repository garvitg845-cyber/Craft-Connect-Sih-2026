import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_PAYMENTS } from '../../lib/demoData'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('payments').select('*, orders(id, customers(profiles(full_name)))').order('created_at', { ascending: false })
      .then(({ data }) => { setPayments(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold">Payments & Transactions</h1>{payments.length === 0 && <DemoBadge />}</div>
      <p className="text-sm text-gray-400 mb-6">Payment gateway records are shown from Supabase when available.</p>
      {payments.length === 0 ? (
        <><DemoNotice className="mb-5" /><div className="space-y-2">{DEMO_PAYMENTS.map((p) => <div key={p.id} className="card flex justify-between items-center"><div><p className="font-medium">Order #{p.order.replace('CC-DEMO-', '')} — {p.customer}</p><p className="text-xs text-gray-400">{p.provider} · {new Date(p.date).toLocaleDateString('en-IN')}</p></div><div className="text-right"><p className="font-semibold">₹{p.amount.toLocaleString('en-IN')}</p><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></div></div>)}</div></>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="card flex justify-between items-center">
              <div>
                <p className="font-medium">Order #{p.orders?.id?.slice(0, 8)} — {p.orders?.customers?.profiles?.full_name}</p>
                <p className="text-xs text-gray-400">{p.provider} · {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{p.amount}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

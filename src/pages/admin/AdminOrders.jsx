import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoLineChart, DemoNotice } from '../../components/DemoPreview'
import { DEMO_ORDERS, DEMO_SALES } from '../../lib/demoData'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('orders').select('*, customers(profiles(full_name)), shipping(current_status)').order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <LoadingSpinner full />

  const isDemo = orders.length === 0
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-2"><h1 className="text-2xl font-bold">All Orders</h1>{isDemo && <DemoBadge />}</div>
      {isDemo && <DemoNotice className="mb-6" />}
      {isDemo && <div className="mb-8"><DemoLineChart data={DEMO_SALES} valueLabel="Order activity" valueKey="orders" prefix="" /></div>}
      {isDemo ? (
        <div className="space-y-2">
          {DEMO_ORDERS.map((o) => <div key={o.id} className="card flex justify-between items-center"><div><p className="font-medium">#{o.id.replace('CC-DEMO-', '')} — {o.customer}</p><p className="text-xs text-gray-400">{new Date(o.date).toLocaleDateString('en-IN')} · {o.product}</p></div><div className="text-right"><p className="font-semibold text-craft-orange">₹{o.amount.toLocaleString('en-IN')}</p><p className="text-xs capitalize text-tech-teal">{o.status.replace(/_/g, ' ')}</p></div></div>)}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => <div key={o.id} className="card flex justify-between items-center"><div><p className="font-medium">#{o.id.slice(0, 8)} — {o.customers?.profiles?.full_name}</p><p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div><div className="text-right"><p className="font-semibold text-craft-orange">₹{o.total_amount}</p><p className="text-xs capitalize text-tech-teal">{(o.shipping?.current_status ?? o.status).replace(/_/g, ' ')}</p></div></div>)}
        </div>
      )}
    </div>
  )
}

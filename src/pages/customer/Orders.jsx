import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoLineChart, DemoNotice } from '../../components/DemoPreview'
import { DEMO_ORDERS, DEMO_SALES } from '../../lib/demoData'

const STAGES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(id, quantity, unit_price, products(title)), shipping(current_status, tracking_number, courier_name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
      setLoading(false)
    }
    if (user) load()
  }, [user])

  if (loading) return <LoadingSpinner full />

  const isDemo = orders.length === 0
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-2"><h1 className="text-2xl font-bold">Your Orders</h1>{isDemo && <DemoBadge />}</div>
      {isDemo && <DemoNotice className="mb-6" />}
      {isDemo && <div className="mb-8"><DemoLineChart data={DEMO_SALES} valueLabel="Order activity" valueKey="orders" prefix="" /></div>}
      {isDemo ? (
        <div className="space-y-5">
          {DEMO_ORDERS.slice(0, 4).map((o) => <div key={o.id} className="card"><div className="flex justify-between items-start mb-3"><div><p className="font-semibold">Order #{o.id.replace('CC-DEMO-', '')}</p><p className="text-xs text-gray-400">{new Date(o.date).toLocaleDateString('en-IN')}</p></div><p className="font-semibold text-craft-orange">₹{o.amount.toLocaleString('en-IN')}</p></div><div className="flex items-center gap-1 mb-3">{STAGES.map((s, idx) => <div key={s} className="flex-1"><div className={`h-1.5 rounded-full ${idx <= STAGES.indexOf(o.status) ? 'bg-craft-orange' : 'bg-gray-200'}`} /></div>)}</div><p className="text-sm capitalize font-medium text-tech-teal mb-2">{o.status.replace(/_/g, ' ')}</p><p className="text-sm text-gray-600">{o.product} × {o.quantity}</p></div>)}
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => { const status = o.shipping?.current_status ?? o.status; const stageIdx = STAGES.indexOf(status); return <div key={o.id} className="card"><div className="flex justify-between items-start mb-3"><div><p className="font-semibold">Order #{o.id.slice(0, 8)}</p><p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p></div><p className="font-semibold text-craft-orange">₹{o.total_amount}</p></div>{status !== 'cancelled' && <div className="flex items-center gap-1 mb-3">{STAGES.map((s, idx) => <div key={s} className="flex-1"><div className={`h-1.5 rounded-full ${idx <= stageIdx ? 'bg-craft-orange' : 'bg-gray-200'}`} /></div>)}</div>}<p className="text-sm capitalize font-medium text-tech-teal mb-2">{status.replace(/_/g, ' ')}</p>{o.shipping?.tracking_number && <p className="text-xs text-gray-500">Tracking: {o.shipping.courier_name} — {o.shipping.tracking_number}</p>}<div className="mt-2 space-y-1">{o.order_items.map((it) => <p key={it.id} className="text-sm text-gray-600">{it.products?.title} × {it.quantity} — ₹{it.unit_price * it.quantity}</p>)}</div></div> })}
        </div>
      )}
    </div>
  )
}

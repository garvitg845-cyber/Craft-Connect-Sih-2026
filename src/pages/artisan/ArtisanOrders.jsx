import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import { DemoBadge, DemoLineChart, DemoNotice } from '../../components/DemoPreview'
import { DEMO_ORDERS, DEMO_SALES } from '../../lib/demoData'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']

export default function ArtisanOrders() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('order_items')
      .select('id, quantity, unit_price, products(title), orders(id, created_at, shipping_address), order_id')
      .eq('artisan_id', user.id)
      .order('created_at', { ascending: false })

    // fetch shipping status for each unique order
    const orderIds = [...new Set((data ?? []).map((d) => d.order_id))]
    const { data: shippingRows } = orderIds.length
      ? await supabase.from('shipping').select('*').in('order_id', orderIds)
      : { data: [] }
    const shippingMap = Object.fromEntries((shippingRows ?? []).map((s) => [s.order_id, s]))

    setItems((data ?? []).map((d) => ({ ...d, shipping: shippingMap[d.order_id] })))
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function updateStatus(orderId, newStatus, currentHistory) {
    const history = [...(currentHistory || []), { status: newStatus, timestamp: new Date().toISOString() }]
    const { error } = await supabase.from('shipping').update({ current_status: newStatus, status_history: history }).eq('order_id', orderId)
    if (error) toast.error(error.message)
    else { toast.success('Order status updated'); load() }
  }

  if (loading) return <LoadingSpinner full />

  const isDemo = items.length === 0
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-2"><h1 className="text-2xl font-bold">Orders</h1>{isDemo && <DemoBadge />}</div>
      {isDemo && <DemoNotice className="mb-6" />}
      {isDemo && <div className="mb-8"><DemoLineChart data={DEMO_SALES} valueLabel="Order activity" valueKey="orders" prefix="" /></div>}
      {isDemo ? (
        <div className="space-y-3">
          {DEMO_ORDERS.map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-4">
              <div><p className="font-medium">{o.product} × {o.quantity}</p><p className="text-sm text-gray-500">₹{o.amount.toLocaleString('en-IN')} · Order #{o.id.replace('CC-DEMO-', '')}</p><p className="text-xs text-gray-400">{o.customer} · {new Date(o.date).toLocaleDateString('en-IN')}</p></div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 capitalize font-medium">{o.status.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="card flex items-center justify-between gap-4">
              <div><p className="font-medium">{it.products?.title} × {it.quantity}</p><p className="text-sm text-gray-500">₹{it.unit_price * it.quantity} · Order #{it.order_id.slice(0, 8)}</p><p className="text-xs text-gray-400">{it.orders?.shipping_address?.city}, {it.orders?.shipping_address?.state}</p></div>
              <select className="input-field w-44" value={it.shipping?.current_status ?? 'placed'} onChange={(e) => updateStatus(it.order_id, e.target.value, it.shipping?.status_history)}>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

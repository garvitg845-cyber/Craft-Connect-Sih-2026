import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { DemoBadge, DemoLineChart, DemoNotice } from '../../components/DemoPreview'
import { DEMO_PRODUCTS, DEMO_SALES } from '../../lib/demoData'

export default function AdminReports() {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: orders }, { data: orderItems }, { data: artisans }] = await Promise.all([
        supabase.from('orders').select('total_amount, status, created_at'),
        supabase.from('order_items').select('artisan_id, quantity, unit_price, artisans(business_name)'),
        supabase.from('artisans').select('id, verification_status'),
      ])
      setData({ orders: orders ?? [], orderItems: orderItems ?? [], artisans: artisans ?? [] })
    }
    load()
  }, [])

  if (!data) return <LoadingSpinner full />

  const totalGMV = data.orders.reduce((s, o) => s + Number(o.total_amount), 0)
  const cancelledOrders = data.orders.filter((o) => o.status === 'cancelled').length

  const byArtisan = {}
  for (const i of data.orderItems) {
    const name = i.artisans?.business_name ?? 'Unknown'
    byArtisan[name] = (byArtisan[name] || 0) + i.quantity * i.unit_price
  }
  const topArtisans = Object.entries(byArtisan).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const verifiedCount = data.artisans.filter((a) => a.verification_status === 'approved').length

  const isDemo = data.orders.length === 0 && data.orderItems.length === 0
  const reportOrders = isDemo ? DEMO_SALES.reduce((s, x) => s + x.orders, 0) : data.orders.length
  const reportGMV = isDemo ? DEMO_SALES.reduce((s, x) => s + x.revenue, 0) : totalGMV
  const reportCancelled = isDemo ? 1 : cancelledOrders
  const reportVerified = isDemo ? Math.max(8, verifiedCount) : verifiedCount
  const reportTopArtisans = isDemo ? [['Demo Artisan Collective', 48200], ['Rajasthan Heritage Crafts', 36900], ['Bamboo Village Studio', 29100]] : topArtisans

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-2"><h1 className="text-2xl font-bold">Platform Reports</h1>{isDemo && <DemoBadge />}</div>
      {isDemo && <DemoNotice className="mb-6" />}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card"><p className="text-xs text-gray-500">Total GMV</p><p className="text-2xl font-bold">₹{reportGMV.toLocaleString('en-IN')}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Total Orders</p><p className="text-2xl font-bold">{reportOrders}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Cancelled Orders</p><p className="text-2xl font-bold">{reportCancelled}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Verified Artisans</p><p className="text-2xl font-bold">{reportVerified}</p></div>
      </div>
      {isDemo && <div className="mb-8"><DemoLineChart data={DEMO_SALES} valueLabel="Platform GMV" valueKey="revenue" /></div>}
      <h2 className="font-semibold mb-3">Top Artisans by Revenue</h2>
      <div className="space-y-2">
        {reportTopArtisans.map(([name, revenue]) => <div key={name} className="card flex justify-between text-sm"><span>{name}</span><span className="font-semibold text-craft-orange">₹{Number(revenue).toLocaleString('en-IN')}</span></div>)}
      </div>
    </div>
  )
}

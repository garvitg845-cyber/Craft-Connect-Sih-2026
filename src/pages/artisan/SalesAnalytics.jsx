import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { DemoBadge, DemoLineChart, DemoNotice } from '../../components/DemoPreview'
import { DEMO_PRODUCTS, DEMO_SALES } from '../../lib/demoData'

export default function SalesAnalytics() {
  const { user } = useAuth()
  const [orderItems, setOrderItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select('quantity, unit_price, created_at, products(title)')
        .eq('artisan_id', user.id)
        .order('created_at', { ascending: true })
      setOrderItems(data ?? [])
      setLoading(false)
    }
    if (user) load()
  }, [user])

  if (loading) return <LoadingSpinner full />

  const isDemo = orderItems.length === 0
  const totalRevenue = isDemo ? DEMO_SALES.reduce((s, i) => s + i.revenue, 0) : orderItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const totalUnits = isDemo ? DEMO_SALES.reduce((s, i) => s + i.units, 0) : orderItems.reduce((s, i) => s + i.quantity, 0)
  const totalOrders = isDemo ? DEMO_SALES.reduce((s, i) => s + i.orders, 0) : orderItems.length

  const byProduct = {}
  for (const i of orderItems) {
    const title = i.products?.title ?? 'Unknown'
    byProduct[title] = (byProduct[title] || 0) + i.quantity * i.unit_price
  }
  const topProducts = isDemo ? DEMO_PRODUCTS.map((p) => [p.title, p.revenue]) : Object.entries(byProduct).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-2"><h1 className="text-2xl font-bold">Sales Analytics</h1>{isDemo && <DemoBadge />}</div>
      {isDemo && <DemoNotice className="mb-6" />}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Units Sold</p><p className="text-2xl font-bold">{totalUnits}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Avg Order Value</p><p className="text-2xl font-bold">₹{Math.round(totalRevenue / Math.max(totalOrders, 1)).toLocaleString('en-IN')}</p></div>
      </div>

      {isDemo && <div className="mb-8"><DemoLineChart data={DEMO_SALES} /></div>}

      <h2 className="font-semibold mb-3">Top Products by Revenue</h2>
      {topProducts.length === 0 ? <EmptyState title="No products to analyse yet" /> : (
        <div className="space-y-2">
          {topProducts.map(([title, revenue]) => (
            <div key={title} className="card flex justify-between text-sm">
              <span>{title}</span>
              <span className="font-semibold text-craft-orange">₹{Number(revenue).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

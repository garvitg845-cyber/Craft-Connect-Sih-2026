import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ count: artisanCount }, { count: customerCount }, { count: pendingVerification }, { count: pendingProducts }, { data: orders }, { count: openReturns }] =
        await Promise.all([
          supabase.from('artisans').select('*', { count: 'exact', head: true }),
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('artisans').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
          supabase.from('orders').select('total_amount'),
          supabase.from('returns').select('*', { count: 'exact', head: true }).in('status', ['requested', 'under_review']),
        ])
      const totalGMV = (orders ?? []).reduce((s, o) => s + Number(o.total_amount), 0)
      setStats({ artisanCount, customerCount, pendingVerification, pendingProducts, totalOrders: orders?.length ?? 0, totalGMV, openReturns })
    }
    load()
  }, [])

  if (!stats) return <LoadingSpinner full />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Total Artisans" value={stats.artisanCount} />
        <Stat label="Total Customers" value={stats.customerCount} />
        <Stat label="Pending Verifications" value={stats.pendingVerification} highlight={stats.pendingVerification > 0} />
        <Stat label="Products Awaiting Review" value={stats.pendingProducts} highlight={stats.pendingProducts > 0} />
        <Stat label="Total Orders" value={stats.totalOrders} />
        <Stat label="Total GMV" value={`₹${stats.totalGMV}`} />
        <Stat label="Open Return Cases" value={stats.openReturns} highlight={stats.openReturns > 0} />
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`card ${highlight ? 'border-craft-orange' : ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

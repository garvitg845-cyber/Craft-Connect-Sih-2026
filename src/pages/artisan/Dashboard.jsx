import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

export default function ArtisanDashboard() {
  const { user, profile } = useAuth()
  const [artisan, setArtisan] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from('artisans').select('*').eq('id', user.id).single()
      const { data: products } = await supabase.from('products').select('id,status,stock_quantity').eq('artisan_id', user.id)
      const { data: orderItems } = await supabase.from('order_items').select('quantity,unit_price,created_at').eq('artisan_id', user.id)

      const totalRevenue = (orderItems ?? []).reduce((s, i) => s + i.quantity * i.unit_price, 0)
      const totalOrders = (orderItems ?? []).length
      const approvedProducts = (products ?? []).filter((p) => p.status === 'approved').length
      const lowStock = (products ?? []).filter((p) => p.stock_quantity <= 3).length

      setArtisan(a)
      setStats({ totalRevenue, totalOrders, totalProducts: products?.length ?? 0, approvedProducts, lowStock })
      setLoading(false)
    }
    if (user) load()
  }, [user])

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome, {profile?.full_name}</h1>

      {artisan?.verification_status !== 'approved' && (
        <div className="card mt-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">
            Your artisan account is <strong>{artisan?.verification_status}</strong>. You can add products as
            drafts, but they will only appear publicly once your profile is verified by our admin team.
          </p>
          <Link to="/artisan/profile" className="text-sm underline text-yellow-800 mt-1 inline-block">Complete your verification profile →</Link>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mt-6">
        <StatCard label="Total Revenue" value={`₹${stats.totalRevenue}`} />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Products (Approved / Total)" value={`${stats.approvedProducts} / ${stats.totalProducts}`} />
        <StatCard label="Low Stock Items" value={stats.lowStock} highlight={stats.lowStock > 0} />
      </div>

      {stats.totalProducts === 0 && (
        <div className="mt-8">
          <EmptyState
            title="You haven't listed any products yet"
            subtitle="Use the AI Product Studio to draft your first listing in minutes."
            actionLabel="Add Your First Product"
            onAction={() => (window.location.href = '/artisan/ai-studio')}
          />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`card ${highlight ? 'border-craft-orange' : ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

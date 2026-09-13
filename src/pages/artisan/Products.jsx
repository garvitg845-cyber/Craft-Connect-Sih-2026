import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_PRODUCTS } from '../../lib/demoData'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ArtisanProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, product_images(storage_path)').eq('artisan_id', user.id).order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function submitForReview(id) {
    const { error } = await supabase.from('products').update({ status: 'pending_review' }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Submitted for admin review'); load() }
  }

  async function remove(id) {
    if (!confirm('Delete this product permanently?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); load() }
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Products</h1>
        <Link to="/artisan/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {products.length === 0 ? (
        <><div className="flex items-center gap-3 mb-3"><DemoBadge /></div><DemoNotice className="mb-5" /><div className="space-y-3">{DEMO_PRODUCTS.map((p) => <div key={p.title} className="card flex items-center gap-4"><div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-50 to-teal-50 flex items-center justify-center text-2xl">🧶</div><div className="flex-1"><p className="font-medium">{p.title}</p><p className="text-sm text-gray-500">Demo price ₹{Math.round(p.revenue / Math.max(p.units, 1)).toLocaleString('en-IN')} · Stock: {p.stock}</p></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 font-medium">Preview</span></div>)}</div></>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {p.product_images?.[0]?.storage_path && (
                  <img src={supabase.storage.from('product-images').getPublicUrl(p.product_images[0].storage_path).data.publicUrl} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-gray-500">₹{p.price} · Stock: {p.stock_quantity}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status.replace('_', ' ')}</span>
              <Link to={`/artisan/products/${p.id}/edit`} className="text-sm text-tech-teal font-medium">Edit</Link>
              {p.status === 'draft' && (
                <button onClick={() => submitForReview(p.id)} className="text-sm text-craft-orange font-medium">Submit</button>
              )}
              <button onClick={() => remove(p.id)} className="text-sm text-red-500">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

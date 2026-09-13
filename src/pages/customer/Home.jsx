import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import { ProductCardSkeleton } from '../../components/Skeleton'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_PRODUCTS } from '../../lib/demoData'

export default function CustomerHome() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('products').select('*, artisans(business_name), product_images(storage_path,is_primary)')
          .eq('status', 'approved').order('created_at', { ascending: false }).limit(24),
        supabase.from('categories').select('*').order('name'),
      ])
      setProducts(p ?? [])
      setCategories(c ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Discover Authentic Handicrafts</h1>
      <p className="text-gray-500 mb-6">Discover handmade products from verified artisans on Craft Connect.</p>

      {categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4">
          {categories.map((c) => (
            <Link key={c.id} to={`/customer/products?category=${c.id}`}
              className="shrink-0 px-4 py-2 rounded-full bg-white border text-sm font-medium hover:border-craft-orange">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Latest Products</h2>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <><div className="flex items-center gap-3 mb-3"><DemoBadge /></div><DemoNotice className="mb-5" /><div className="grid grid-cols-2 md:grid-cols-4 gap-5">{DEMO_PRODUCTS.map((p) => <div key={p.title} className="card"><div className="h-36 bg-gradient-to-br from-orange-50 to-teal-50 rounded-lg mb-3 flex items-center justify-center text-4xl">🧵</div><h3 className="font-medium text-sm">{p.title}</h3><p className="text-xs text-gray-500">Craft Connect artisan</p><p className="font-semibold text-craft-orange mt-1">Demo price ₹{Math.round(p.revenue / Math.max(p.units, 1)).toLocaleString('en-IN')}</p><span className="text-[10px] text-gray-400">Preview only</span></div>)}</div></>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <Link to={`/customer/products/${p.id}`} key={p.id} className="card hover:shadow-md transition">
              <div className="h-36 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center text-gray-300">
                {p.product_images?.[0]?.storage_path ? (
                  <img src={supabase.storage.from('product-images').getPublicUrl(p.product_images[0].storage_path).data.publicUrl} className="w-full h-full object-cover" alt={p.title} />
                ) : 'No image'}
              </div>
              <h3 className="font-medium text-sm truncate">{p.title}</h3>
              <p className="text-xs text-gray-500">{p.artisans?.business_name}</p>
              <p className="font-semibold text-craft-orange mt-1">₹{p.price}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

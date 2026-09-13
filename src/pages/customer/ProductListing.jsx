import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import { ProductCardSkeleton } from '../../components/Skeleton'

export default function ProductListing() {
  const [params] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    q: params.get('q') || '',
    category: params.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
  })

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('products')
        .select('*, artisans(business_name, state), product_images(storage_path)')
        .eq('status', 'approved')

      if (filters.q) q = q.ilike('title', `%${filters.q}%`)
      if (filters.category) q = q.eq('category_id', filters.category)
      if (filters.minPrice) q = q.gte('price', Number(filters.minPrice))
      if (filters.maxPrice) q = q.lte('price', Number(filters.maxPrice))
      if (filters.sort === 'newest') q = q.order('created_at', { ascending: false })
      if (filters.sort === 'price_asc') q = q.order('price', { ascending: true })
      if (filters.sort === 'price_desc') q = q.order('price', { ascending: false })

      const { data, error } = await q
      setProducts(error ? [] : (data ?? []))
      setLoading(false)
    }
    load()
  }, [filters])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-6">
      <aside className="card h-fit space-y-4">
        <h3 className="font-semibold">Filters</h3>
        <input placeholder="Search products..." className="input-field" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <div>
          <label className="text-sm font-medium">Category</label>
          <select className="input-field mt-1" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input placeholder="Min ₹" type="number" className="input-field" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
          <input placeholder="Max ₹" type="number" className="input-field" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Sort by</label>
          <select className="input-field mt-1" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </aside>

      <div className="md:col-span-3">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : products.length === 0 ? (
          <EmptyState title="No products match your filters" subtitle="Try widening your search or check back later as more artisans list their work." />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <Link to={`/customer/products/${p.id}`} key={p.id} className="card hover:shadow-md transition">
                <div className="h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center text-gray-300">
                  {p.product_images?.[0]?.storage_path ? <img src={supabase.storage.from('product-images').getPublicUrl(p.product_images[0].storage_path).data.publicUrl} className="w-full h-full object-cover" alt={p.title} /> : 'No image'}
                </div>
                <h3 className="font-medium text-sm truncate">{p.title}</h3>
                <p className="text-xs text-gray-500">{p.artisans?.business_name} · {p.artisans?.state}</p>
                <p className="font-semibold text-craft-orange mt-1">₹{p.price}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

export default function ArtisanProfile() {
  const { id } = useParams()
  const [artisan, setArtisan] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from('artisans').select('*').eq('id', id).eq('verification_status', 'approved').single()
      const { data: p } = await supabase.from('products').select('*, product_images(storage_path)').eq('artisan_id', id).eq('status', 'approved')
      setArtisan(a || null)
      setProducts(p ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <LoadingSpinner full />
  if (!artisan) return <div className="max-w-2xl mx-auto px-4 py-16"><EmptyState title="Artisan not found or not yet verified" /></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="card mb-8">
        <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">{artisan.business_name}</h1>
        <p className="text-sm text-gray-500">{artisan.craft_type} · {artisan.district}, {artisan.state}</p>
        <p className="text-gray-600 mt-4">{artisan.story || 'This artisan has not added their story yet.'}</p>
      </div><Link to={`/customer/artisans/${id}/passport`} className="btn-outline shrink-0 text-sm inline-flex items-center">Craft Passport</Link></div>
      </div>
      <h2 className="text-lg font-semibold mb-4">Products</h2>
      {products.length === 0 ? <EmptyState title="No products listed yet" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <Link to={`/customer/products/${p.id}`} key={p.id} className="card">
              <div className="h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                {p.product_images?.[0]?.storage_path && <img src={supabase.storage.from('product-images').getPublicUrl(p.product_images[0].storage_path).data.publicUrl} className="w-full h-full object-cover" alt={p.title} />}
              </div>
              <p className="text-sm font-medium truncate">{p.title}</p>
              <p className="text-craft-orange font-semibold text-sm">₹{p.price}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

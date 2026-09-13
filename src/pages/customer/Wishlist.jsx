import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Wishlist() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('wishlists')
      .select('id, products(id,title,price,product_images(storage_path))')
      .eq('customer_id', user.id)
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function remove(id) {
    await supabase.from('wishlists').delete().eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>
      {items.length === 0 ? (
        <EmptyState title="No saved items yet" subtitle="Tap the heart icon on any product to save it here." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((w) => (
            <div key={w.id} className="card">
              <Link to={`/customer/products/${w.products.id}`}>
                <div className="h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                  {w.products.product_images?.[0]?.storage_path && (
                    <img src={supabase.storage.from('product-images').getPublicUrl(w.products.product_images[0].storage_path).data.publicUrl} className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-sm font-medium truncate">{w.products.title}</p>
                <p className="text-craft-orange font-semibold text-sm">₹{w.products.price}</p>
              </Link>
              <button onClick={() => remove(w.id)} className="text-xs text-red-500 mt-2">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

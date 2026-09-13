import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Cart() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', user.id).single()
    if (!cart) { setItems([]); setLoading(false); return }
    const { data } = await supabase
      .from('cart_items')
      .select('id, quantity, product_id, products(id,title,price,stock_quantity, product_images(storage_path))')
      .eq('cart_id', cart.id)
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function updateQty(itemId, quantity) {
    if (quantity < 1) return
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId)
    load()
  }

  async function removeItem(itemId) {
    await supabase.from('cart_items').delete().eq('id', itemId)
    toast.success('Removed from cart')
    load()
  }

  const total = items.reduce((sum, i) => sum + (i.products?.price || 0) * i.quantity, 0)

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      {items.length === 0 ? (
        <EmptyState title="Your cart is empty" subtitle="Browse the marketplace to find something handmade." actionLabel="Shop Now" onAction={() => navigate('/customer/products')} />
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.products?.product_images?.[0]?.storage_path && (
                    <img src={supabase.storage.from('product-images').getPublicUrl(item.products.product_images[0].storage_path).data.publicUrl}
                      className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <Link to={`/customer/products/${item.product_id}`} className="font-medium">{item.products?.title}</Link>
                  <p className="text-craft-orange font-semibold">₹{item.products?.price}</p>
                </div>
                <input type="number" min={1} max={item.products?.stock_quantity} value={item.quantity}
                  onChange={(e) => updateQty(item.id, Number(e.target.value))} className="input-field w-16" />
                <button onClick={() => removeItem(item.id)} className="text-red-500 text-sm">Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center card">
            <span className="font-semibold text-lg">Total: ₹{total}</span>
            <button onClick={() => navigate('/customer/checkout')} className="btn-primary">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  )
}

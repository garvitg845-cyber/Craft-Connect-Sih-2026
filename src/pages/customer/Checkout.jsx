import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

export default function Checkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [address, setAddress] = useState({ line1: '', city: '', state: '', pincode: '' })
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', user.id).single()
      if (!cart) { setLoading(false); return }
      const { data } = await supabase
        .from('cart_items')
        .select('id, quantity, product_id, products(id,title,price,artisan_id,stock_quantity)')
        .eq('cart_id', cart.id)
      setItems(data ?? [])
      setLoading(false)
    }
    if (user) load()
  }, [user])

  const total = items.reduce((s, i) => s + (i.products?.price || 0) * i.quantity, 0)

  async function placeOrder() {
    if (!address.line1 || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in your full address')
      return
    }
    if (items.some((i) => i.quantity > (i.products?.stock_quantity ?? 0))) {
      toast.error('One or more items exceed available stock')
      return
    }
    setPlacing(true)
    try {
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        customer_id: user.id,
        status: 'placed',
        total_amount: total,
        shipping_address: address,
      }).select().single()
      if (orderErr) throw orderErr

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        artisan_id: i.products.artisan_id,
        quantity: i.quantity,
        unit_price: i.products.price,
      }))
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
      if (itemsErr) throw itemsErr

      await supabase.from('shipping').insert({
        order_id: order.id,
        current_status: 'placed',
        status_history: [{ status: 'placed', timestamp: new Date().toISOString() }],
      })

      // Decrement stock for each product (best-effort; a DB trigger/RPC is recommended for production)
      for (const i of items) {
        await supabase.from('products').update({ stock_quantity: i.products.stock_quantity - i.quantity }).eq('id', i.product_id)
      }

      const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', user.id).single()
      if (cart) await supabase.from('cart_items').delete().eq('cart_id', cart.id)

      toast.success('Order placed!')
      navigate('/customer/orders')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <LoadingSpinner full />
  if (items.length === 0) return <div className="max-w-2xl mx-auto px-4 py-16"><EmptyState title="Your cart is empty" subtitle="Add items before checking out." /></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="card space-y-3">
        <h3 className="font-semibold">Shipping Address</h3>
        <input className="input-field" placeholder="Address line" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input className="input-field" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
        </div>
        <input className="input-field" placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm py-1">
            <span>{i.products.title} × {i.quantity}</span>
            <span>₹{i.products.price * i.quantity}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold border-t mt-2 pt-2">
          <span>Total</span><span>₹{total}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Note: Payment gateway integration is not connected in this build. Orders are recorded with a "placed"
        status; wire up Razorpay/Stripe in the `payments` table workflow before going live.
      </p>

      <button onClick={placeOrder} disabled={placing} className="btn-primary w-full">
        {placing ? 'Placing order...' : `Place Order — ₹${total}`}
      </button>
    </div>
  )
}

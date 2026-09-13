import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_PRODUCTS } from '../../lib/demoData'

export default function Inventory() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('products').select('id,title,stock_quantity').eq('artisan_id', user.id)
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function updateStock(id, value) {
    const { error } = await supabase.from('products').update({ stock_quantity: value }).eq('id', id)
    if (error) toast.error(error.message)
    else load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold">Inventory</h1>{products.length === 0 && <DemoBadge />}</div>
      {products.length === 0 ? (
        <><DemoNotice className="mb-5" /><div className="space-y-3">{DEMO_PRODUCTS.map((p) => <div key={p.title} className="card flex items-center justify-between"><div><p className="font-medium">{p.title}</p><p className={`text-xs ${p.stock <= 3 ? 'text-red-500' : 'text-gray-500'}`}>{p.stock <= 3 ? 'Low stock' : 'Healthy stock'} · Demo</p></div><input type="number" className="input-field w-24" value={p.stock} disabled /></div>)}</div></>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className={`card flex items-center justify-between ${p.stock_quantity <= 3 ? 'border-red-300' : ''}`}>
              <div>
                <p className="font-medium">{p.title}</p>
                {p.stock_quantity <= 3 && <p className="text-xs text-red-500">Low stock</p>}
              </div>
              <input
                type="number"
                className="input-field w-24"
                value={p.stock_quantity}
                onChange={(e) => updateStock(p.id, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

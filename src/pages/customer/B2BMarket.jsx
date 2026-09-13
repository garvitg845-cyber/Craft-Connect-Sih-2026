import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Send, PackageCheck, Clock3, CheckCircle2, XCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const MIN_QTY = 40
const MIN_DAYS = 6

function minDeliveryDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + MIN_DAYS)
  return d.toISOString().slice(0, 10)
}

export default function B2BMarket() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [requests, setRequests] = useState([])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const minDate = useMemo(() => minDeliveryDate(), [])
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: user?.email || '',
    phone: '',
    quantity: String(MIN_QTY),
    target_price: '',
    delivery_date: minDate,
    message: ''
  })

  async function load() {
    const productPromise = supabase
      .from('products')
      .select('id,title,description,price,bulk_price,bulk_min_quantity,stock_quantity,artisans(id,business_name,state),product_images(storage_path,is_primary)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    const requestPromise = user
      ? supabase
          .from('market_inquiries')
          .select('id,quantity,delivery_date,status,created_at,products(title),artisans(business_name)')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null })

    const [{ data: productsData, error: productsError }, { data: requestData, error: requestError }] = await Promise.all([
      productPromise,
      requestPromise
    ])

    if (productsError) toast.error(productsError.message)
    if (requestError) toast.error(requestError.message)
    setProducts(productsData || [])
    setRequests(requestData || [])
  }

  useEffect(() => {
    load()
  }, [user])

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [p.title, p.description, p.artisans?.business_name, p.artisans?.state]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [products, query])

  function openRequest(product) {
    setSelected(product)
    setForm({
      company: '',
      name: '',
      email: user?.email || '',
      phone: '',
      quantity: String(MIN_QTY),
      target_price: product.bulk_price ? String(product.bulk_price) : '',
      delivery_date: minDate,
      message: ''
    })
  }

  async function submit(e) {
    e.preventDefault()
    if (!selected || !user) return

    const quantity = Number(form.quantity)
    if (!Number.isInteger(quantity) || quantity < MIN_QTY) {
      toast.error(`Minimum bulk quantity is ${MIN_QTY} pieces.`)
      return
    }
    if (!form.delivery_date || form.delivery_date < minDate) {
      toast.error(`Bulk delivery must be requested at least ${MIN_DAYS} days from today.`)
      return
    }
    if (!selected.artisans?.id) {
      toast.error('This product is missing its artisan information.')
      return
    }

    setSending(true)
    try {
      const { error } = await supabase.from('market_inquiries').insert({
        product_id: selected.id,
        artisan_id: selected.artisans.id,
        buyer_id: user.id,
        buyer_name: form.name,
        buyer_company: form.company,
        buyer_email: form.email,
        buyer_phone: form.phone,
        quantity,
        target_price: form.target_price ? Number(form.target_price) : null,
        delivery_date: form.delivery_date,
        message: form.message,
        status: 'new'
      })
      if (error) throw error
      toast.success('Request sent directly to the artisan')
      setSelected(null)
      await load()
    } catch (error) {
      toast.error(error.message || 'Could not send request')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-craft-orange uppercase">Market Linkage</span>
          <h1 className="text-3xl font-bold mt-1">B2B Artisan Marketplace</h1>
          <p className="text-gray-500 mt-2">Choose any approved product and send your bulk requirement directly to its artisan.</p>
        </div>
        <div className="card py-3 px-4 flex gap-3 items-center">
          <Building2 className="text-tech-teal" />
          <span className="text-sm">Buyer → Artisan direct request</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <div className="card flex gap-3 items-center">
          <PackageCheck className="text-tech-teal" />
          <div>
            <p className="font-semibold">Minimum bulk order: {MIN_QTY} pieces</p>
            <p className="text-xs text-gray-500">You can request any approved product; the artisan decides if they can fulfil the quantity.</p>
          </div>
        </div>
        <div className="card flex gap-3 items-center">
          <Clock3 className="text-craft-orange" />
          <div>
            <p className="font-semibold">Minimum delivery window: {MIN_DAYS} days</p>
            <p className="text-xs text-gray-500">The requested delivery date cannot be earlier than 6 days from today.</p>
          </div>
        </div>
      </div>

      <div className="card mb-5 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field border-0 shadow-none focus:ring-0 flex-1"
          placeholder="Search any approved product or artisan…"
        />
        <span className="text-xs text-gray-500">{visibleProducts.length} products</span>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <PackageCheck className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold text-gray-800">No approved products available</p>
          <p className="text-sm">Approved products will appear here. No separate B2B approval is required.</p>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">No products match your search.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleProducts.map((p) => {
            const img = p.product_images?.find((x) => x.is_primary)?.storage_path || p.product_images?.[0]?.storage_path
            const publicUrl = img ? supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl : ''
            return (
              <div className="card" key={p.id}>
                <div className="h-48 rounded-xl overflow-hidden bg-gray-100 mb-3">
                  {publicUrl ? <img src={publicUrl} alt={p.title} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-400">No image</div>}
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.artisans?.business_name || 'Artisan'} · {p.artisans?.state || 'India'}</p>
                <div className="flex justify-between mt-3 text-sm">
                  <span>Retail ₹{p.price}</span>
                  {p.bulk_price ? <span className="font-semibold text-tech-teal">Indicative bulk ₹{p.bulk_price}</span> : null}
                </div>
                <p className="text-xs text-gray-500 mt-2">Request from {MIN_QTY} pieces · final fulfilment decided by artisan</p>
                <button onClick={() => openRequest(p)} className="btn-primary w-full mt-4 flex justify-center gap-2">
                  <Send className="w-4 h-4" /> Request this product
                </button>
                <Link className="block text-center text-xs text-tech-teal mt-3" to={`/customer/products/${p.id}`}>View product</Link>
              </div>
            )
          })}
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">My B2B Requests</h2>
          <span className="text-xs text-gray-500">Artisan decides accept / reject</span>
        </div>
        {requests.length === 0 ? (
          <div className="card py-6 text-sm text-gray-500">Your requests will appear here after you send one.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3" key={r.id}>
                <div>
                  <p className="font-semibold">{r.products?.title || 'Product'}</p>
                  <p className="text-sm text-gray-500">{r.artisans?.business_name || 'Artisan'} · {r.quantity} pieces · needed by {r.delivery_date}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold flex items-center gap-1 w-fit">
                  {r.status === 'accepted' ? <CheckCircle2 className="w-3 h-3" /> : r.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold">Request this product in bulk</h2>
            <p className="text-sm text-gray-500 mt-1">{selected.title} · {selected.artisans?.business_name || 'Artisan'}</p>
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 mt-4 text-xs">
              <b>Direct request:</b> your request goes straight to the artisan. They will check their stock/capacity and accept or reject it. Admin does not decide the request.
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium">Company / organisation</label>
                <input required className="input-field mt-1" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Buyer name</label>
                <input required className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Email</label>
                <input required type="email" className="input-field mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Phone</label>
                <input className="input-field mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Quantity (minimum {MIN_QTY})</label>
                <input required type="number" min={MIN_QTY} step="1" className="input-field mt-1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Target price / unit (₹)</label>
                <input type="number" min="0" className="input-field mt-1" value={form.target_price} onChange={(e) => setForm({ ...form, target_price: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium">Required delivery date (minimum {MIN_DAYS} days)</label>
                <input required type="date" min={minDate} className="input-field mt-1" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
              </div>
            </div>

            <label className="text-xs font-medium block mt-3">Message to artisan</label>
            <textarea className="input-field mt-1" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Packaging, branding, customisation, delivery details…" />

            <div className="flex gap-2 mt-4">
              <button type="button" className="btn-outline flex-1" onClick={() => setSelected(null)}>Cancel</button>
              <button disabled={sending} className="btn-primary flex-1">{sending ? 'Sending…' : 'Submit request'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

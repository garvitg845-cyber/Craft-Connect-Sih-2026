import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Maximize2, Minus, Plus, Sparkles, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

export default function ProductDetails() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [enhance, setEnhance] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('products').select('*, artisans(id,business_name,story,state), product_images(storage_path,is_primary), categories(name)').eq('id', id).single(),
        supabase.from('reviews').select('*, customers(id, profiles(full_name))').eq('product_id', id).order('created_at', { ascending: false }),
      ])
      setProduct(p || null)
      setReviews(r ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  const imageUrls = useMemo(() => {
    if (!product) return []
    return (product.product_images || []).map(img => supabase.storage.from('product-images').getPublicUrl(img.storage_path).data.publicUrl)
  }, [product])

  async function addToCart() {
    if (!user) return toast.error('Please log in as a customer to add to cart')
    if (profile?.role !== 'customer') return toast.error('Only customer accounts can shop')
    let { data: cart } = await supabase.from('carts').select('id').eq('customer_id', user.id).single()
    if (!cart) {
      const { data: newCart, error } = await supabase.from('carts').insert({ customer_id: user.id }).select().single()
      if (error) return toast.error(error.message)
      cart = newCart
    }
    const { error } = await supabase.from('cart_items').upsert({ cart_id: cart.id, product_id: id, quantity: qty }, { onConflict: 'cart_id,product_id' })
    if (error) toast.error(error.message)
    else toast.success('Added to cart')
  }

  async function addToWishlist() {
    if (!user) return toast.error('Please log in to save items')
    const { error } = await supabase.from('wishlists').insert({ customer_id: user.id, product_id: id })
    if (error) toast.error(error.code === '23505' ? 'Already in wishlist' : error.message)
    else toast.success('Added to wishlist')
  }

  if (loading) return <LoadingSpinner full />
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-16"><EmptyState title="Product not found" /></div>

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const currentUrl = imageUrls[activeImage] || null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10">
      <div>
        <div className="relative h-[480px] bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border">
          {currentUrl ? <img src={currentUrl} className={`max-w-full max-h-full object-contain transition ${enhance ? 'brightness-105 contrast-110 saturate-105' : ''}`} style={{ filter: enhance ? 'contrast(1.12) brightness(1.06) drop-shadow(0 8px 16px rgba(0,0,0,.12))' : 'none' }} alt={product.title} /> : <span className="text-gray-300">No image uploaded</span>}
          {currentUrl && <button type="button" onClick={() => { setZoomOpen(true); setZoom(1) }} className="absolute right-3 top-3 bg-white/95 shadow rounded-lg p-2" title="Open zoom viewer"><Maximize2 className="w-5 h-5" /></button>}
        </div>
        {imageUrls.length > 1 && <div className="grid grid-cols-5 gap-2 mt-3">{imageUrls.map((url, index) => <button key={`${url}-${index}`} type="button" onClick={() => setActiveImage(index)} className={`aspect-square rounded-lg overflow-hidden border-2 ${index === activeImage ? 'border-craft-orange' : 'border-transparent'}`}><img src={url} alt={`Product view ${index + 1}`} className="w-full h-full object-cover" /></button>)}</div>}
        <div className="flex flex-wrap gap-2 mt-3">
          <button type="button" onClick={() => setEnhance(v => !v)} className="btn-outline text-sm"><Sparkles className="w-4 h-4 inline mr-1" />{enhance ? 'Normal image' : 'Enhance view'}</button>
          <span className="text-xs text-gray-400 self-center">{imageUrls.length || 0} product photo · zoom viewer available</span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <Link to={`/customer/artisans/${product.artisans?.id}`} className="text-tech-teal text-sm font-medium">by {product.artisans?.business_name || 'Craft Connect artisan'}</Link>
        {avgRating && <p className="text-sm text-gray-500 mt-1">⭐ {avgRating} ({reviews.length} reviews)</p>}
        <p className="text-3xl font-bold text-craft-orange mt-4">₹{product.price}</p>
        <p className="text-gray-600 mt-4 whitespace-pre-line">{product.description || 'No description provided yet.'}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-gray-500">
          {product.material && <div><span className="font-medium text-gray-700">Material:</span> {product.material}</div>}
          {product.dimensions && <div><span className="font-medium text-gray-700">Dimensions:</span> {product.dimensions}</div>}
          {product.categories?.name && <div><span className="font-medium text-gray-700">Category:</span> {product.categories.name}</div>}
          <div><span className="font-medium text-gray-700">In stock:</span> {product.stock_quantity}</div>
        </div>
        <div className="flex items-center gap-3 mt-6"><input type="number" min={1} max={product.stock_quantity || 1} value={qty} onChange={e => setQty(Number(e.target.value))} className="input-field w-20" /><button onClick={addToCart} disabled={product.stock_quantity === 0} className="btn-primary">{product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</button><button onClick={addToWishlist} className="btn-outline">♡ Save</button></div>
        <button type="button" onClick={() => navigate('/customer/craft-guide', { state: { query: product.title } })} className="mt-4 w-full border border-tech-teal/30 bg-teal-50 text-tech-teal rounded-lg px-4 py-3 text-sm font-semibold"><Sparkles className="w-4 h-4 inline mr-2" />Ask AI about this craft tradition</button>
        {product.artisans?.story && <div className="mt-6 card"><h3 className="font-semibold mb-2">The Artisan's Story</h3><p className="text-sm text-gray-600">{product.artisans.story}</p></div>}
        <div className="mt-8"><h3 className="font-semibold mb-3">Reviews</h3>{reviews.length === 0 ? <p className="text-sm text-gray-400">No reviews yet. Be the first to review after your purchase.</p> : <div className="space-y-3">{reviews.map(r => <div key={r.id} className="border-b pb-2"><p className="text-sm font-medium">{r.customers?.profiles?.full_name || 'Customer'} — ⭐{r.rating}</p><p className="text-sm text-gray-500">{r.comment}</p></div>)}</div>}</div>
      </div>

      {zoomOpen && currentUrl && <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}><div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}><img src={currentUrl} alt="Zoomed product" className="max-w-[90vw] max-h-[88vh] object-contain" style={{ transform: `scale(${zoom})`, filter: enhance ? 'contrast(1.12) brightness(1.06)' : 'none' }} /><div className="absolute top-4 right-4 flex gap-2"><button className="bg-white rounded-lg p-2" onClick={() => setZoom(z => Math.min(4, z + 0.5))}><Plus /></button><button className="bg-white rounded-lg p-2" onClick={() => setZoom(z => Math.max(1, z - 0.5))}><Minus /></button><button className="bg-white rounded-lg p-2" onClick={() => setZoomOpen(false)}><X /></button></div></div></div>}
    </div>
  )
}

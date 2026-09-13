import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Camera, Sparkles, Wand2, ShoppingBag, Download, Palette, ShieldCheck, Home as HomeIcon } from 'lucide-react'
import { callEdgeFunction } from '../../lib/supabaseClient'
import { compressImage } from '../../lib/imageCompressor'
import { supabase } from '../../lib/supabaseClient'

const OCCASIONS = ['Diwali', 'Holi', 'Wedding', 'Eid', 'Christmas', 'Puja', 'Housewarming', 'Everyday', 'Shop / Store Display']
const STYLES = ['AI chooses', 'Traditional Indian', 'Modern Indian', 'Minimal', 'Boho', 'Luxury', 'Rustic']

function productImage(product) {
  if (product?.image_url) return product.image_url
  const img = product?.product_images?.find(x => x.is_primary) || product?.product_images?.[0]
  return img?.storage_path ? supabase.storage.from('product-images').getPublicUrl(img.storage_path).data.publicUrl : ''
}

export default function AIDecor() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [occasion, setOccasion] = useState('Diwali')
  const [style, setStyle] = useState('AI chooses')
  const [notes, setNotes] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const productsById = useMemo(() => Object.fromEntries((result?.products || []).map(p => [p.id, p])), [result])

  function onFile(next) {
    if (!next) return
    if (!next.type.startsWith('image/')) return toast.error('Please select an image.')
    setFile(next)
    setPreview(URL.createObjectURL(next))
    setResult(null)
  }

  async function design() {
    if (!file) return toast.error('Pehle room/shop ki photo upload karo.')
    setLoading(true)
    try {
      const optimized = await compressImage(file, { maxSide: 1280, maxBytes: 650 * 1024, quality: 0.72 })
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(optimized)
      })
      const res = await callEdgeFunction('ai-home-decor', { image_data_url: dataUrl, occasion, style, notes, budget: budget ? Number(budget) : null }, 110000)
      setResult(res)
      toast.success('AI decor plan ready — live Craft Connect products used.')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function addCompleteLook() {
    if (!result?.design?.shopping_plan?.length) return toast.error('No products were selected for this look.')
    try {
      let { data: cart } = await supabase.from('carts').select('id').eq('customer_id', (await supabase.auth.getUser()).data.user.id).single()
      if (!cart) {
        const user = (await supabase.auth.getUser()).data.user
        const created = await supabase.from('carts').insert({ customer_id: user.id }).select('id').single()
        if (created.error) throw created.error
        cart = created.data
      }
      for (const item of result.design.shopping_plan) {
        const product = productsById[item.product_id]
        if (!product) continue
        const quantity = Math.max(1, Math.min(Number(item.quantity || 1), Number(product.stock_quantity || 1)))
        const { error } = await supabase.from('cart_items').upsert({ cart_id: cart.id, product_id: product.id, quantity }, { onConflict: 'cart_id,product_id' })
        if (error) throw error
      }
      toast.success('Complete look added to your cart.')
    } catch (e) { toast.error(e.message || 'Could not add the complete look.') }
  }

  async function downloadPreview() {
    if (!preview || !result) return
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = preview
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const placements = result.design?.placements || []
    for (const placement of placements) {
      const p = productsById[placement.product_id]; const src = productImage(p); if (!src) continue
      const thumb = new Image(); thumb.crossOrigin = 'anonymous'; thumb.src = src
      try { await new Promise((resolve, reject) => { thumb.onload = resolve; thumb.onerror = reject }) } catch { continue }
      const size = Math.round(Math.min(canvas.width, canvas.height) * Math.max(0.08, Math.min(0.28, Number(placement.size || 14) / 100)))
      const x = Math.round(canvas.width * Math.min(0.95, Math.max(0.05, Number(placement.x || 50) / 100)) - size / 2)
      const y = Math.round(canvas.height * Math.min(0.95, Math.max(0.05, Number(placement.y || 50) / 100)) - size / 2)
      ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x, y, size, size, Math.round(size * .12)); ctx.fill(); ctx.clip(); ctx.drawImage(thumb, x, y, size, size); ctx.restore()
      ctx.fillStyle = 'rgba(17,24,39,.78)'; ctx.fillRect(x, Math.min(canvas.height - 26, y + size - 24), Math.min(size, 230), 24)
      ctx.fillStyle = '#fff'; ctx.font = `${Math.max(11, Math.round(size / 11))}px Arial`; ctx.fillText(String(p.title).slice(0, 28), x + 7, Math.min(canvas.height - 9, y + size - 8))
    }
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .9));
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'craft-connect-ai-decor-preview.jpg'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-6 items-start">
        <div>
          <div className="flex items-center gap-2 text-craft-orange text-xs font-semibold uppercase tracking-wider"><Wand2 className="w-4 h-4" /> AI Home Decor Studio</div>
          <h1 className="text-3xl font-bold mt-2">Decorate your real space with crafts from Craft Connect</h1>
          <p className="text-gray-500 mt-2">Room, shop, office, balcony ya kisi bhi space ki photo upload karo. AI space ko samjhega, occasion puchega, aur <b>website par available approved products</b> se decor plan + visual mockup banayega.</p>

          <div className="card mt-5 space-y-4">
            <label className="border-2 border-dashed rounded-2xl min-h-64 flex items-center justify-center cursor-pointer overflow-hidden bg-orange-50/30">
              {preview ? <img src={preview} alt="Space" className="max-h-72 w-full object-contain" /> : <div className="text-center"><Camera className="w-10 h-10 mx-auto text-craft-orange" /><p className="font-semibold mt-3">Upload room / shop photo</p><p className="text-xs text-gray-400 mt-1">Living room, bedroom, office, boutique, counter, balcony, pooja space etc.</p></div>}
              <input hidden type="file" accept="image/*" onChange={e => onFile(e.target.files?.[0])} />
            </label>

            {file && <div className="rounded-xl bg-orange-50 border border-orange-100 p-4"><p className="text-sm font-semibold">Ye decoration kis ke liye hai?</p><div className="flex flex-wrap gap-2 mt-3">{OCCASIONS.map(x => <button key={x} type="button" onClick={() => setOccasion(x)} className={`px-3 py-2 rounded-full text-xs border ${occasion === x ? 'bg-craft-orange text-white border-craft-orange' : 'bg-white hover:border-craft-orange'}`}>{x}</button>)}</div></div>}

            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className="text-xs text-gray-500">Design style</label><select className="input-field mt-1" value={style} onChange={e => setStyle(e.target.value)}>{STYLES.map(x => <option key={x}>{x}</option>)}</select></div>
              <div><label className="text-xs text-gray-500">Budget (₹)</label><input type="number" min="0" className="input-field mt-1" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 5000" /></div>
              <div><label className="text-xs text-gray-500">Special request</label><input className="input-field mt-1" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. no drilling" /></div>
            </div>

            <button disabled={loading || !file} onClick={design} className="btn-primary w-full flex justify-center items-center gap-2"><Sparkles className="w-5 h-5" />{loading ? 'AI is designing your space…' : 'Create AI Decor Design'}</button>
            <div className="flex items-center gap-2 text-xs text-gray-400"><ShieldCheck className="w-4 h-4 text-tech-teal" /> Recommendations use only approved, in-stock Craft Connect products returned from Supabase.</div>
          </div>
        </div>

        <div className="space-y-5">
          {!result ? <div className="card min-h-[600px] flex flex-col justify-center items-center text-center"><HomeIcon className="w-16 h-16 text-craft-orange" /><h2 className="text-xl font-semibold mt-4">Your AI decor preview will appear here</h2><p className="text-sm text-gray-500 max-w-lg mt-2">Upload a photo, choose the occasion, and AI will select real products from the Craft Connect catalog and place them as a visual mockup.</p></div> : <>
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><div><span className="text-xs font-semibold uppercase text-craft-orange">{result.design?.style || 'AI design'} · {occasion}</span><h2 className="text-2xl font-bold">AI Decor Preview</h2><p className="text-sm text-gray-500">{result.design?.concept}</p></div><button onClick={downloadPreview} className="btn-outline inline-flex items-center gap-2"><Download className="w-4 h-4" /> Save Preview</button></div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 min-h-[420px]">
                <img src={preview} alt="AI decor base" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/5" />
                {(result.design?.placements || []).map((pl, i) => { const p = productsById[pl.product_id]; const src = productImage(p); const size = Math.max(10, Math.min(30, pl.size || 16)); return <div key={`${pl.product_id}-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 group z-10" style={{ left: `${pl.x}%`, top: `${pl.y}%`, width: `${size}%` }}><div className="relative"><span className="absolute -inset-2 rounded-2xl border-2 border-craft-orange/90 animate-pulse pointer-events-none" /><div className="rounded-2xl bg-white/95 p-1.5 shadow-2xl border-2 border-craft-orange/80"><div className="aspect-square rounded-xl overflow-hidden bg-white flex items-center justify-center">{src ? <img src={src} alt={p?.title || 'Craft product'} className="w-full h-full object-contain" /> : <Palette className="w-1/2 h-1/2 text-gray-300" />}</div><div className="px-1.5 pt-1"><p className="text-[10px] font-bold truncate">{p?.title || 'Craft product'}</p><p className="text-[9px] text-craft-orange font-medium truncate">{pl.placement}</p></div></div><span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-craft-orange text-white text-xs font-bold flex items-center justify-center shadow-lg">{i + 1}</span></div></div> })}
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Highlighted mockup: real Craft Connect product photos are placed at AI-suggested locations. Orange rings and numbers show exactly which product is being recommended at each spot.</p>
            </div>

            <div className="card"><h3 className="font-semibold">Why this design?</h3><p className="text-sm text-gray-600 mt-2">{result.design?.reasoning}</p><div className="flex flex-wrap gap-2 mt-3">{(result.design?.color_palette || []).map(c => <span key={c} className="px-2.5 py-1 rounded-full bg-orange-50 text-craft-orange text-xs">{c}</span>)}</div></div>

            <div className="card"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Shop this look</h3><p className="text-xs text-gray-500 mt-1">Real products selected from the live Craft Connect catalog.</p></div><button onClick={addCompleteLook} className="btn-primary inline-flex items-center gap-2 text-sm"><ShoppingBag className="w-4 h-4" /> Add Complete Look</button></div><div className="grid sm:grid-cols-2 gap-3 mt-4">{(result.design?.shopping_plan || []).map(item => { const p = productsById[item.product_id]; return p ? <Link key={item.product_id} to={`/customer/products/${p.id}`} className="border rounded-xl p-3 flex gap-3 hover:border-craft-orange"><div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">{productImage(p) && <img src={productImage(p)} alt={p.title} className="w-full h-full object-cover" />}</div><div className="min-w-0"><p className="font-medium text-sm truncate">{p.title}</p><p className="text-craft-orange font-semibold text-sm">₹{p.price}</p><p className="text-xs text-gray-500 mt-1">Qty {item.quantity} · {item.reason}</p></div></Link> : null })}</div><div className="mt-4 flex items-center justify-between border-t pt-4"><span className="font-semibold">Estimated look total</span><span className="text-xl font-bold text-craft-orange">₹{(result.design?.shopping_plan || []).reduce((sum, item) => sum + Number(productsById[item.product_id]?.price || 0) * Number(item.quantity || 1), 0).toLocaleString('en-IN')}</span></div></div>

            {result.design?.do_not_change?.length > 0 && <div className="card"><h3 className="font-semibold">Keep these as-is</h3><ul className="list-disc pl-5 text-sm text-gray-600 mt-2 space-y-1">{result.design.do_not_change.map(x => <li key={x}>{x}</li>)}</ul></div>}
          </>}
        </div>
      </div>
    </div>
  )
}

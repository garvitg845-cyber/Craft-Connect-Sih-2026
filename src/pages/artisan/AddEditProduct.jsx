import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mic, MicOff, Sparkles, ChevronDown, Image as ImageIcon } from 'lucide-react'
import { supabase, callEdgeFunction } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ImageLab from '../../components/ImageLab'
import { imageToDataUrl, compressImage } from '../../lib/imageCompressor'

const EMPTY = { title: '', description: '', material: '', dimensions: '', production_time_days: '', tags: '', price: '', stock_quantity: '', category_id: '', b2b_ready: false, bulk_min_quantity: 40, bulk_price: '' }
const speechLocales = { Hindi: 'hi-IN', English: 'en-IN', Punjabi: 'pa-IN', Gujarati: 'gu-IN', Marathi: 'mr-IN', Bengali: 'bn-IN', Tamil: 'ta-IN' }

export default function AddEditProduct() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState([])
  const [files, setFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [voice, setVoice] = useState('')
  const [language, setLanguage] = useState('Hindi')
  const [listening, setListening] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [advanced, setAdvanced] = useState(isEdit)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const Recognition = useMemo(() => window.SpeechRecognition || window.webkitSpeechRecognition, [])

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    const aiDraft = location.state?.aiDraft
    if (!aiDraft || isEdit) return
    setForm(f => ({ ...f, title: aiDraft.title || f.title, description: aiDraft.description || f.description, material: aiDraft.material || f.material, dimensions: aiDraft.dimensions || f.dimensions, tags: (aiDraft.tags || []).join(', '), production_time_days: aiDraft.estimated_production_time_days || f.production_time_days }))
    setAdvanced(true)
  }, [location.state, isEdit])

  useEffect(() => {
    (async () => {
      if (!isEdit) return
      const [{ data }, { data: images }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_images').select('*').eq('product_id', id).order('is_primary', { ascending: false }).order('created_at'),
      ])
      if (data) setForm({ ...EMPTY, ...data, tags: (data.tags ?? []).join(', ') })
      setExistingImages(images ?? [])
      setLoading(false)
    })()
  }, [id, isEdit])

  function startVoice() {
    if (!Recognition) return toast.error('Voice input is supported in Chrome/Edge.')
    const r = new Recognition()
    r.lang = speechLocales[language] || 'hi-IN'
    r.interimResults = false
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onerror = () => { setListening(false); toast.error('Could not hear clearly. Try again.') }
    r.onresult = e => setVoice(v => `${v} ${e.results[0][0].transcript}`.trim())
    r.start()
  }

  async function prepareImageForAI(file) {
    // Small AI-only copy; original file remains available for product storage.
    return imageToDataUrl(file, { maxSide: 1024, maxBytes: 420 * 1024, quality: 0.68 })
  }

  async function analyze() {
    if (!voice.trim() && !files.length) return toast.error('Speak about the product or add a photo first.')
    setAnalyzing(true)
    try {
      const image_urls = []
      for (const file of files.slice(0, 6)) image_urls.push(await prepareImageForAI(file))
      const res = await callEdgeFunction('ai-product-studio', { text_input: voice, language, image_urls })
      const d = res.draft || {}
      const suggested = categories.find(c => c.name?.toLowerCase().includes((d.category_suggestion || '').toLowerCase()) || (d.category_suggestion || '').toLowerCase().includes(c.name?.toLowerCase()))
      setForm(f => ({ ...f, title: d.title || f.title, description: d.description || f.description, material: d.material || f.material, dimensions: d.dimensions || f.dimensions, production_time_days: d.estimated_production_time_days || f.production_time_days, tags: (d.tags || []).join(', '), category_id: suggested?.id || f.category_id }))
      setAdvanced(true)
      toast.success('AI filled the product details. Review the generated fields, price and stock.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function save(e) {
    e.preventDefault()
    if (!form.title) return toast.error('Use AI to generate product details first.')
    if (!files.length && !existingImages.length) return toast.error('Add at least one product photo.')
    setSaving(true)
    try {
      const payload = {
        artisan_id: user.id,
        title: form.title,
        description: form.description,
        material: form.material,
        dimensions: form.dimensions,
        production_time_days: form.production_time_days ? Number(form.production_time_days) : null,
        tags: form.tags.split(',').map(x => x.trim()).filter(Boolean),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        category_id: form.category_id || null,
        b2b_ready: Boolean(form.b2b_ready),
        bulk_min_quantity: Math.max(40, Number(form.bulk_min_quantity) || 40),
        bulk_price: form.bulk_price ? Number(form.bulk_price) : null,
      }
      let pid = id
      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert({ ...payload, status: 'draft' }).select().single()
        if (error) throw error
        pid = data.id
        await supabase.from('inventory').insert({ product_id: pid, quantity_available: payload.stock_quantity })
      }

      if (files.length) {
        const rows = []
        for (let i = 0; i < files.length; i += 1) {
          const file = await compressImage(files[i], { maxSide: 1800, maxBytes: 1200 * 1024, quality: 0.82 })
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const path = `${user.id}/${pid}_${Date.now()}_${i}_${safeName}`
          const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false })
          if (error) throw error
          rows.push({ product_id: pid, storage_path: path, is_primary: !existingImages.length && i === 0 })
        }
        const { error: imageError } = await supabase.from('product_images').insert(rows)
        if (imageError) throw imageError
      }
      toast.success(isEdit ? 'Product updated with gallery.' : 'Product draft saved with photo gallery.')
      navigate('/artisan/products')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <span className="text-xs font-semibold text-craft-orange uppercase tracking-wider">AI assisted listing</span>
        <h1 className="text-3xl font-bold mt-1">{isEdit ? 'Edit Product' : 'Add a product by speaking & showing it'}</h1>
        <p className="text-gray-500 mt-2">Tell Craft AI what you made, add up to 6 photos, improve them in the photo lab, then review the generated listing before saving.</p>
      </div>

      <div className="card space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">1. Speak about your craft</label>
            <select className="input-field mt-2" value={language} onChange={e => setLanguage(e.target.value)}>{Object.keys(speechLocales).map(x => <option key={x}>{x}</option>)}</select>
            <textarea className="input-field h-28 mt-2" placeholder="Voice transcript appears here… You can also type a few words." value={voice} onChange={e => setVoice(e.target.value)} />
            <button type="button" onClick={startVoice} className={`w-full mt-2 ${listening ? 'btn-primary' : 'btn-secondary'} flex justify-center gap-2`}>{listening ? <><MicOff /> Listening…</> : <><Mic /> Start voice command</>}</button>
          </div>
          <div className="rounded-xl border bg-orange-50/30 p-4">
            <p className="font-semibold">2. AI listing workflow</p>
            <ol className="text-sm text-gray-600 mt-3 space-y-2 list-decimal list-inside">
              <li>Upload 1–6 photos from different angles.</li>
              <li>AI studies all uploaded photos + your voice/text.</li>
              <li>Review the title, story, material, tags and category.</li>
              <li>Enter price and stock, then save the draft.</li>
            </ol>
            <div className="mt-4 flex items-center gap-2 text-xs text-tech-teal"><ImageIcon className="w-4 h-4" /> Your gallery is stored in Supabase Storage.</div>
          </div>
        </div>

        {existingImages.length > 0 && (
          <div className="border rounded-xl p-4">
            <p className="text-sm font-semibold mb-3">Existing gallery</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {existingImages.map(img => {
                const url = supabase.storage.from('product-images').getPublicUrl(img.storage_path).data.publicUrl
                return <img key={img.id} src={url} alt="Existing product" className="aspect-square w-full object-cover rounded-lg" />
              })}
            </div>
          </div>
        )}

        <ImageLab files={files} setFiles={setFiles} />

        <button type="button" onClick={analyze} disabled={analyzing} className="btn-primary w-full flex justify-center gap-2"><Sparkles />{analyzing ? 'Craft AI is analysing…' : 'Auto-fill product with AI'}</button>

        {advanced && (
          <form onSubmit={save} className="border-t pt-5 space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold">AI generated listing — review before saving</h2><button type="button" className="text-sm text-tech-teal" onClick={() => setAdvanced(!advanced)}>Hide details</button></div>
            <input required className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="AI title" />
            <textarea className="input-field h-28" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" />
            <div className="grid sm:grid-cols-2 gap-3"><input className="input-field" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} placeholder="Material" /><input className="input-field" value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} placeholder="Dimensions" /></div>
            <input className="input-field" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Tags" />
            <select className="input-field" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <div className="grid sm:grid-cols-2 gap-3"><input required type="number" min="1" className="input-field" placeholder="Your price (₹)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /><input required type="number" min="0" className="input-field" placeholder="Stock available" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: e.target.value })} /></div>
            <div className="rounded-xl border bg-orange-50/30 p-4"><label className="flex items-center gap-2 font-semibold text-sm"><input type="checkbox" checked={Boolean(form.b2b_ready)} onChange={e => setForm({ ...form, b2b_ready: e.target.checked })} /> Make this product available to B2B / bulk buyers</label>{form.b2b_ready&&<div className="grid sm:grid-cols-2 gap-3 mt-3"><input type="number" min="40" className="input-field" placeholder="Minimum bulk quantity (40+)" value={form.bulk_min_quantity} onChange={e=>setForm({...form,bulk_min_quantity:e.target.value})}/><input type="number" min="0" className="input-field" placeholder="Bulk price per unit (₹)" value={form.bulk_price} onChange={e=>setForm({...form,bulk_price:e.target.value})}/></div>}<p className="text-xs text-gray-500 mt-2">This optional flag stores bulk pricing metadata. Buyers can request any approved product through Market Linkage; the flag does not block B2B requests.</p></div>
            <input type="number" className="input-field" placeholder="Production time (days)" value={form.production_time_days} onChange={e => setForm({ ...form, production_time_days: e.target.value })} />
            <button disabled={saving} className="btn-secondary w-full">{saving ? 'Saving…' : 'Save AI Draft + Photo Gallery'}</button>
          </form>
        )}
        {!advanced && form.title && <button type="button" className="btn-outline w-full flex justify-center gap-2" onClick={() => setAdvanced(true)}>Review generated details <ChevronDown /></button>}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { callEdgeFunction, supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import ImageLab from '../../components/ImageLab'
import { imageToDataUrl, compressImage } from '../../lib/imageCompressor'

const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Tamil', 'Bengali', 'Gujarati', 'Punjabi']

export default function AIProductStudio() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [textInput, setTextInput] = useState('')
  const [language, setLanguage] = useState('Hindi')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState(location.state?.aiDraft || null)

  async function prepareImageForAI(file) {
    // Small AI-only copy; original file remains available for product storage.
    return imageToDataUrl(file, { maxSide: 1024, maxBytes: 420 * 1024, quality: 0.68 })
  }

  async function generate(e) {
    e.preventDefault()
    if (!textInput.trim() && !files.length) return toast.error('Describe your product or upload an image')
    setLoading(true)
    try {
      const image_urls = []
      for (const file of files.slice(0, 6)) image_urls.push(await prepareImageForAI(file))
      const res = await callEdgeFunction('ai-product-studio', { text_input: textInput, language, image_urls })
      setDraft(res.draft)
      toast.success('Draft generated — review and edit before publishing')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">AI Product Studio</h1>
      <p className="text-gray-500 mb-6">Speak or type in your language, show up to 6 photos, and let AI draft the listing. You always review before publishing.</p>

      <form onSubmit={generate} className="card space-y-4">
        <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</select>
        <textarea className="input-field h-28" placeholder="e.g. यह हाथ से बनी मिट्टी की मूर्ति है, जयपुर से..." value={textInput} onChange={e => setTextInput(e.target.value)} />
        <ImageLab files={files} setFiles={setFiles} compact />
        <button disabled={loading} className="btn-secondary w-full">{loading ? 'Generating with AI...' : 'Generate Draft from Voice/Text + All Photos'}</button>
      </form>

      {draft && <div className="card mt-6 space-y-3">
        <h3 className="font-semibold">Review AI Draft (editable)</h3>
        <EditableField label="Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} />
        <EditableField label="Description" value={draft.description} onChange={v => setDraft({ ...draft, description: v })} textarea />
        <EditableField label="Material" value={draft.material} onChange={v => setDraft({ ...draft, material: v })} />
        <EditableField label="Dimensions" value={draft.dimensions} onChange={v => setDraft({ ...draft, dimensions: v })} />
        <EditableField label="Tags" value={(draft.tags || []).join(', ')} onChange={v => setDraft({ ...draft, tags: v.split(',').map(t => t.trim()) })} />
        <EditableField label="English Translation" value={draft.translation_en} onChange={v => setDraft({ ...draft, translation_en: v })} textarea />
        <EditableField label="Hindi Translation" value={draft.translation_hi} onChange={v => setDraft({ ...draft, translation_hi: v })} textarea />
        <button type="button" className="btn-primary w-full" onClick={() => navigate('/artisan/products/new', { state: { aiDraft: draft } })}>Use This Draft → Continue to Product Form</button>
      </div>}
    </div>
  )
}

function EditableField({ label, value, onChange, textarea }) {
  return <div><label className="text-xs font-medium text-gray-500">{label}</label>{textarea ? <textarea className="input-field mt-1" value={value || ''} onChange={e => onChange(e.target.value)} /> : <input className="input-field mt-1" value={value || ''} onChange={e => onChange(e.target.value)} />}</div>
}

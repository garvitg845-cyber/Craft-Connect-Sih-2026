import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, Mic, MicOff, Sparkles, Globe2, ShieldCheck } from 'lucide-react'
import { callEdgeFunction } from '../../lib/supabaseClient'

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Bengali', 'Gujarati', 'Punjabi']
const LOCALES = { English: 'en-IN', Hindi: 'hi-IN', Marathi: 'mr-IN', Tamil: 'ta-IN', Bengali: 'bn-IN', Gujarati: 'gu-IN', Punjabi: 'pa-IN' }

export default function CraftGuide() {
  const Recognition = useMemo(() => window.SpeechRecognition || window.webkitSpeechRecognition, [])
  const [query, setQuery] = useState('')
  const [place, setPlace] = useState('')
  const [language, setLanguage] = useState('English')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)

  function startVoice() {
    if (!Recognition) return toast.error('Voice input works in Chrome/Edge.')
    const recognition = new Recognition()
    recognition.lang = LOCALES[language]
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => { setListening(false); toast.error('Could not hear you clearly.') }
    recognition.onresult = e => setQuery(q => `${q} ${e.results[0][0].transcript}`.trim())
    recognition.start()
  }

  function selectImage(next) {
    setFile(next || null)
    if (next) setPreview(URL.createObjectURL(next))
    else setPreview('')
  }

  async function prepareImageForAI(nextFile) {
    if (!nextFile) return null
    const objectUrl = URL.createObjectURL(nextFile)
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = objectUrl
      })
      const maxSide = 1280
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.72)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  async function ask(e) {
    e.preventDefault()
    if (!query.trim() && !file && !place.trim()) return toast.error('Ask about a craft, place, or upload a craft photo.')
    setLoading(true)
    try {
      const image_data_url = file ? await prepareImageForAI(file) : null
      const res = await callEdgeFunction('ai-craft-guide', { query, place, language, image_data_url })
      setAnswer(res.answer)
      toast.success('Craft Guide found a detailed explanation.')
    } catch (e2) {
      toast.error(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-craft-orange">Global AI heritage desk</span>
          <h1 className="text-3xl font-bold mt-1">AI Craft Guide — from Jaipur to Oaxaca</h1>
          <p className="text-gray-500 mt-2">Ask about a craft, region, technique or upload a photo. The AI explains likely origin, materials, making process, cultural context, care and related traditions.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Madhubani, India', 'Kintsugi, Japan', 'Talavera, Mexico', 'Navajo weaving, USA', 'Berber rugs, Morocco'].map(x => <button key={x} type="button" onClick={() => setQuery(x)} className="px-3 py-1.5 rounded-full bg-white border text-xs hover:border-craft-orange">{x}</button>)}
          </div>

          <form onSubmit={ask} className="card mt-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Craft / question" value={query} onChange={e => setQuery(e.target.value)} />
              <input className="input-field" placeholder="Place or country (optional)" value={place} onChange={e => setPlace(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <select className="input-field" value={language} onChange={e => setLanguage(e.target.value)}>{LANGUAGES.map(l => <option key={l}>{l}</option>)}</select>
              <button type="button" onClick={startVoice} className={listening ? 'btn-primary whitespace-nowrap' : 'btn-outline whitespace-nowrap'}>{listening ? <><MicOff className="inline w-4 h-4 mr-1" /> Listening</> : <><Mic className="inline w-4 h-4 mr-1" /> Voice</>}</button>
            </div>
            <label className="border-2 border-dashed rounded-xl min-h-40 flex items-center justify-center cursor-pointer overflow-hidden bg-orange-50/30">
              {preview ? <img src={preview} alt="Craft to identify" className="max-h-52 w-full object-contain" /> : <div className="text-center"><Camera className="w-8 h-8 mx-auto text-craft-orange" /><p className="font-medium mt-2">Upload a craft photo for AI identification</p><p className="text-xs text-gray-400">The AI reports confidence/uncertainty instead of pretending an identification is certain.</p></div>}
              <input hidden type="file" accept="image/*" onChange={e => selectImage(e.target.files?.[0])} />
            </label>
            <button disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2"><Sparkles className="w-5 h-5" />{loading ? 'AI is researching the craft…' : 'Ask Craft Guide'}</button>
          </form>
        </div>

        <div className="card min-h-[520px]">
          {!answer ? (
            <div className="h-full min-h-[470px] flex flex-col justify-center items-center text-center text-gray-400">
              <Globe2 className="w-16 h-16 text-craft-orange mb-4" />
              <h2 className="text-xl font-semibold text-gray-800">Your global craft encyclopedia</h2>
              <p className="max-w-md mt-2">Try a place like “Bali”, a tradition like “Ikat”, or show the camera a handmade object.</p>
              <div className="mt-5 flex items-center gap-2 text-xs"><ShieldCheck className="w-4 h-4 text-tech-teal" /> AI flags uncertainty and avoids claiming photo-based authenticity.</div>
            </div>
          ) : (
            <div className="space-y-5">
              <div><span className="text-xs text-craft-orange font-semibold uppercase">Likely identification</span><h2 className="text-2xl font-bold">{answer.name || 'Craft tradition'}</h2><p className="text-gray-500">{answer.location || 'Global tradition'} · {answer.confidence || 'AI assessment'}</p></div>
              {['summary','origin_history','materials','technique','cultural_context','motifs_and_meaning','care_and_preservation'].map(key => answer[key] && <section key={key}><h3 className="font-semibold capitalize">{key.replaceAll('_', ' ')}</h3><p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{answer[key]}</p></section>)}
              {answer.related_crafts?.length > 0 && <section><h3 className="font-semibold">Related traditions</h3><div className="flex flex-wrap gap-2 mt-2">{answer.related_crafts.map(x => <span key={x} className="text-xs bg-orange-50 text-craft-orange px-2 py-1 rounded-full">{x}</span>)}</div></section>}
              {answer.sources_note && <p className="text-xs text-gray-400 border-t pt-3">{answer.sources_note}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

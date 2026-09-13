import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Search, Sparkles, MapPin, CalendarDays, Utensils, Palette, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, callEdgeFunction } from '../../lib/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const QUICK_PLACES = [
  { name: 'Haryana', crafts: 'Panipat handloom, durries & traditional pottery' },
  { name: 'Rajasthan', crafts: 'Blue pottery, block printing, Bandhani & Kathputli' },
  { name: 'Gujarat', crafts: 'Patola, Ajrakh, Bandhani & Kutch embroidery' },
  { name: 'Punjab', crafts: 'Phulkari, Punjabi jutti & traditional weaving' },
  { name: 'West Bengal', crafts: 'Kantha, terracotta, Dokra & Baluchari' },
  { name: 'Odisha', crafts: 'Pattachitra, applique & silver filigree' },
  { name: 'Kashmir', crafts: 'Pashmina, papier-mâché & Kashmiri embroidery' },
  { name: 'Madhya Pradesh', crafts: 'Chanderi, Maheshwari, Gond art & Dhokra' },
  { name: 'Tamil Nadu', crafts: 'Kanjivaram silk, bronze casting & Tanjore art' },
  { name: 'Kerala', crafts: 'Coir, bell-metal, mural art & handloom' },
]

export default function CraftMap() {
  const [regions, setRegions] = useState([])
  const [artisansByState, setArtisansByState] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [place, setPlace] = useState('')
  const [guide, setGuide] = useState(null)
  const [guideLoading, setGuideLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: r, error: regionError } = await supabase.from('craft_regions').select('*').order('state_name')
        if (regionError) throw regionError
        const regionRows = r ?? []
        setRegions(regionRows)

        const { data: artisans } = await supabase
          .from('artisans')
          .select('id, business_name, state, craft_type')
          .eq('verification_status', 'approved')
        const grouped = {}
        for (const a of artisans ?? []) {
          if (!grouped[a.state]) grouped[a.state] = []
          grouped[a.state].push(a)
        }
        setArtisansByState(grouped)
      } catch (error) {
        toast.error('Could not load live craft-region data. You can still use Global Place AI below.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function explorePlace(nextPlace = place) {
    const value = nextPlace.trim()
    if (!value) return toast.error('Enter a state, city, country or region.')
    setPlace(value)
    setGuideLoading(true)
    setGuide(null)
    try {
      const res = await callEdgeFunction('ai-craft-guide', {
        query: `Give me a practical heritage and local discovery guide for ${value}. If it has famous crafts, explain them. Also tell me about worthwhile local activities, food, places, festivals or experiences. If there is no especially famous craft, clearly say that and explain what is still culturally or locally interesting there.`,
        place: value,
        language: 'English',
      }, 60000)
      setGuide(res.answer)
    } catch (error) {
      toast.error(error.message || 'Could not research this place.')
    } finally {
      setGuideLoading(false)
    }
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-craft-orange">India + worldwide discovery</span>
        <h1 className="text-3xl font-bold mt-1">Craft Map & Place Explorer</h1>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Explore live craft-region records from Supabase, or type <strong>any state, city, country or region</strong> to get an AI-powered guide. The AI can also explain what is worth experiencing when a place is not known for a particular craft.
        </p>
      </div>

      <section className="card mb-7 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white border border-orange-100"><Sparkles className="w-6 h-6 text-craft-orange" /></div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Where do you want to explore?</h2>
            <p className="text-sm text-gray-500 mt-1">Try “Haryana”, “Rajasthan”, “Jaipur”, “Kutch”, “Japan” or any place in the world.</p>
            <form onSubmit={(e) => { e.preventDefault(); explorePlace() }} className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input value={place} onChange={(e) => setPlace(e.target.value)} className="input-field pl-10" placeholder="Enter state, city, country or region" />
              </div>
              <button disabled={guideLoading} className="btn-primary flex items-center justify-center gap-2 sm:min-w-44">
                {guideLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {guideLoading ? 'Researching…' : 'Explore with AI'}
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Haryana', 'Rajasthan', 'Gujarat', 'Japan', 'Morocco'].map((x) => (
                <button key={x} type="button" onClick={() => explorePlace(x)} className="px-3 py-1.5 rounded-full bg-white border text-xs font-medium hover:border-craft-orange hover:text-craft-orange">{x}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {guide && (
        <section className="card mb-8 border-teal-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-tech-teal">AI place guide</span>
              <h2 className="text-2xl font-bold mt-1">{guide.name || place}</h2>
              <p className="text-sm text-gray-500 mt-1">{guide.location || place} · {guide.confidence || 'AI researched overview'}</p>
            </div>
            <a href="/customer/craft-guide" className="btn-outline text-sm flex items-center gap-2">Open Global Craft AI <ExternalLink className="w-4 h-4" /></a>
          </div>

          {guide.summary && <p className="text-gray-700 mt-4 leading-7">{guide.summary}</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {guide.crafts?.length > 0 && <InfoCard icon={<Palette />} title="Famous crafts" items={guide.crafts} />}
            {guide.activities?.length > 0 && <InfoCard icon={<MapPin />} title="Things to experience" items={guide.activities} />}
            {guide.foods?.length > 0 && <InfoCard icon={<Utensils />} title="Local food" items={guide.foods} />}
            {guide.places_to_visit?.length > 0 && <InfoCard icon={<MapPin />} title="Places to explore" items={guide.places_to_visit} />}
            {guide.festivals?.length > 0 && <InfoCard icon={<CalendarDays />} title="Festivals & events" items={guide.festivals} />}
            {guide.best_time && <InfoCard icon={<CalendarDays />} title="Best time" items={[guide.best_time]} />}
          </div>
          {guide.if_no_famous_craft && <div className="mt-5 rounded-xl bg-gray-50 border p-4"><h3 className="font-semibold">If this place is not known for a major craft</h3><p className="text-sm text-gray-600 mt-1">{guide.if_no_famous_craft}</p></div>}
          {guide.sources_note && <p className="text-xs text-gray-400 border-t mt-5 pt-3">{guide.sources_note}</p>}
          {guide.sources?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{guide.sources.slice(0, 6).map((s) => <a key={s.uri} href={s.uri} target="_blank" rel="noreferrer" className="text-xs text-tech-teal underline">{s.title || 'Source'}</a>)}</div>}
        </section>
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-6 mb-8 items-start">
        <div className="card p-3">
          <img src="/assets/india-craft-map.webp" alt="Illustrated map of Indian craft traditions" className="w-full rounded-lg object-contain max-h-[520px]" />
          <p className="text-xs text-gray-500 mt-2">Reference map for India's craft regions.</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-lg">Craft traditions stored in Supabase</h2>
          <p className="text-sm text-gray-600 mt-2">These markers come from your live <code>craft_regions</code> table. If the table is empty, the Place Explorer above still works with AI.</p>
          {regions.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4">{regions.flatMap(r => r.famous_crafts || []).slice(0, 30).map((c, i) => <span key={`${c}-${i}`} className="text-xs px-2 py-1 rounded-full bg-orange-50 text-craft-orange">{c}</span>)}</div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 border p-4 text-sm text-gray-500">No live craft-region records have been added yet. Use the AI Place Explorer above for Haryana, Rajasthan or any worldwide location.</div>
          )}
        </div>
      </div>

      <section className="mb-7">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div><h2 className="text-xl font-bold">Quick state explorer</h2><p className="text-sm text-gray-500">Start with a popular Indian craft region.</p></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {QUICK_PLACES.map((item) => (
            <button key={item.name} type="button" onClick={() => explorePlace(item.name)} className="text-left bg-white border rounded-xl p-4 hover:border-craft-orange transition">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-5">{item.crafts}</p>
            </button>
          ))}
        </div>
      </section>

      {regions.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[500px] rounded-xl overflow-hidden border">
            <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url={MAPBOX_TOKEN ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
              {regions.map((r) => (
                <Marker key={r.id} position={[r.latitude, r.longitude]} eventHandlers={{ click: () => setSelected(r) }}>
                  <Popup><strong>{r.state_name}</strong><br />{r.famous_crafts?.join(', ')}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="card h-fit">
            {selected ? (
              <>
                <h3 className="font-semibold text-lg">{selected.state_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
                <div className="mt-3"><p className="text-sm font-medium">Famous Crafts</p><div className="flex flex-wrap gap-1 mt-1">{selected.famous_crafts?.map((c) => <span key={c} className="text-xs bg-orange-50 text-craft-orange px-2 py-1 rounded-full">{c}</span>)}</div></div>
                <div className="mt-4"><p className="text-sm font-medium">Verified Artisans</p>{(artisansByState[selected.state_name] ?? []).length === 0 ? <p className="text-xs text-gray-400 mt-1">No verified artisans from this state yet.</p> : <ul className="text-sm text-gray-600 mt-1 space-y-1">{artisansByState[selected.state_name].map((a) => <li key={a.id}>{a.business_name} — {a.craft_type}</li>)}</ul>}</div>
                <button type="button" onClick={() => explorePlace(selected.state_name)} className="btn-secondary w-full mt-4">Explore this state with AI</button>
              </>
            ) : <p className="text-sm text-gray-400">Select a live state marker to see details.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon, title, items }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <div className="flex items-center gap-2 font-semibold">{icon && <span className="text-craft-orange">{icon}</span>}{title}</div>
      <ul className="mt-2 space-y-1.5 text-sm text-gray-600">{items.slice(0, 8).map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}</ul>
    </div>
  )
}

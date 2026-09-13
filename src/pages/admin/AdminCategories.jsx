import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminCategories() {
  const { user } = useAuth()
  const [tab, setTab] = useState('categories')
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)

  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [regionForm, setRegionForm] = useState({ state_name: '', latitude: '', longitude: '', famous_crafts: '', description: '' })

  async function load() {
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('craft_regions').select('*').order('state_name'),
    ])
    setCategories(c ?? [])
    setRegions(r ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addCategory(e) {
    e.preventDefault()
    const slug = catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const { error } = await supabase.from('categories').insert({ name: catForm.name, slug, description: catForm.description })
    if (error) toast.error(error.message)
    else { toast.success('Category added'); setCatForm({ name: '', description: '' }); load() }
  }

  async function deleteCategory(id) {
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  async function addRegion(e) {
    e.preventDefault()
    if (!regionForm.latitude || !regionForm.longitude) return toast.error('Provide real coordinates for this state')
    const { error } = await supabase.from('craft_regions').insert({
      state_name: regionForm.state_name,
      latitude: Number(regionForm.latitude),
      longitude: Number(regionForm.longitude),
      famous_crafts: regionForm.famous_crafts.split(',').map((c) => c.trim()).filter(Boolean),
      description: regionForm.description,
      created_by: user.id,
    })
    if (error) toast.error(error.message)
    else { toast.success('Craft region added'); setRegionForm({ state_name: '', latitude: '', longitude: '', famous_crafts: '', description: '' }); load() }
  }

  async function deleteRegion(id) {
    await supabase.from('craft_regions').delete().eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Categories & Craft Regions</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === 'categories' ? 'bg-craft-orange text-white' : 'bg-white border'}`}>Categories</button>
        <button onClick={() => setTab('regions')} className={`px-4 py-2 rounded-lg font-medium text-sm ${tab === 'regions' ? 'bg-craft-orange text-white' : 'bg-white border'}`}>Craft Map Regions</button>
      </div>

      {tab === 'categories' ? (
        <>
          <form onSubmit={addCategory} className="card space-y-2 mb-6">
            <input className="input-field" placeholder="Category name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            <input className="input-field" placeholder="Description" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            <button className="btn-primary w-full">Add Category</button>
          </form>
          {categories.length === 0 ? <EmptyState title="No categories yet" /> : (
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="card flex justify-between items-center">
                  <span>{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-sm text-red-500">Delete</button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <form onSubmit={addRegion} className="card space-y-2 mb-6">
            <input className="input-field" placeholder="State name (e.g. Rajasthan)" value={regionForm.state_name} onChange={(e) => setRegionForm({ ...regionForm, state_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" className="input-field" placeholder="Latitude" value={regionForm.latitude} onChange={(e) => setRegionForm({ ...regionForm, latitude: e.target.value })} />
              <input type="number" step="any" className="input-field" placeholder="Longitude" value={regionForm.longitude} onChange={(e) => setRegionForm({ ...regionForm, longitude: e.target.value })} />
            </div>
            <input className="input-field" placeholder="Famous crafts (comma separated)" value={regionForm.famous_crafts} onChange={(e) => setRegionForm({ ...regionForm, famous_crafts: e.target.value })} />
            <textarea className="input-field" placeholder="Description" value={regionForm.description} onChange={(e) => setRegionForm({ ...regionForm, description: e.target.value })} />
            <button className="btn-primary w-full">Add Region</button>
          </form>
          {regions.length === 0 ? <EmptyState title="No craft regions added yet" subtitle="Add real states with accurate coordinates to populate the Craft Map." /> : (
            <div className="space-y-2">
              {regions.map((r) => (
                <div key={r.id} className="card flex justify-between items-center">
                  <div>
                    <p className="font-medium">{r.state_name}</p>
                    <p className="text-xs text-gray-500">{r.famous_crafts?.join(', ')}</p>
                  </div>
                  <button onClick={() => deleteRegion(r.id)} className="text-sm text-red-500">Delete</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

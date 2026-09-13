import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, MapPin, Store, Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'

function imageFor(product) {
  const path = product?.product_images?.find(x => x.is_primary)?.storage_path || product?.product_images?.[0]?.storage_path
  return path ? supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl : ''
}

export default function CraftPassport() {
  const { id } = useParams()
  const [artisan, setArtisan] = useState(null)
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from('artisans').select('*').eq('id', id).eq('verification_status', 'approved').single(),
        supabase.from('products').select('id,title,price,description,material,product_images(storage_path,is_primary)').eq('artisan_id', id).eq('status', 'approved').gt('stock_quantity', 0).limit(12)
      ])
      setArtisan(a || null); setProducts(p || [])
      if (a) { const { data: prof } = await supabase.from('profiles').select('full_name,avatar_url,contact_email').eq('id', id).single(); setProfile(prof || null) }
      setLoading(false)
    }
    load()
  }, [id])
  if (loading) return <LoadingSpinner full />
  if (!artisan) return <div className="max-w-2xl mx-auto px-4 py-16"><EmptyState title="Craft Passport not available" subtitle="This artisan may not be verified yet." /></div>
  return <div className="max-w-6xl mx-auto px-4 py-8">
    <Link to={`/customer/artisans/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-craft-orange mb-5"><ArrowLeft className="w-4 h-4" /> Back to artisan</Link>
    <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-6">
      <section className="card overflow-hidden">
        <div className="h-52 bg-gradient-to-br from-orange-100 to-teal-50 flex items-center justify-center">{profile?.avatar_url ? <img src={profile.avatar_url} className="w-36 h-36 rounded-full object-cover border-4 border-white shadow" alt={profile.full_name || artisan.business_name} /> : <Award className="w-24 h-24 text-craft-orange" />}</div>
        <div className="p-5"><div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-tech-teal text-xs font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Verified Artisan</div><h1 className="text-2xl font-bold mt-3">{profile?.full_name || artisan.business_name}</h1><p className="font-semibold text-craft-orange mt-1">{artisan.business_name}</p><p className="text-sm text-gray-500 mt-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> {artisan.district}, {artisan.state}</p><p className="text-sm text-gray-600 mt-4">{artisan.story || 'This artisan has shared their craft journey through Craft Connect.'}</p></div>
      </section>
      <section className="space-y-5">
        <div className="card"><div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-craft-orange" /><h2 className="text-lg font-semibold">Digital Craft Passport</h2></div><p className="text-sm text-gray-500 mt-2">A public craft identity that connects this verified artisan, their place, tradition and authentic products.</p><div className="grid sm:grid-cols-2 gap-3 mt-5"><Info label="Craft / Technique" value={artisan.craft_type || 'Handcrafted tradition'} /><Info label="Region" value={`${artisan.district}, ${artisan.state}`} /><Info label="Business" value={artisan.business_name} /><Info label="Verification" value="Admin verified" /></div></div>
        <div className="card"><div className="flex items-center justify-between"><h2 className="font-semibold">Authentic Products</h2><Store className="w-5 h-5 text-craft-orange" /></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">{products.map(p => <Link to={`/customer/products/${p.id}`} key={p.id} className="border rounded-xl p-2 hover:border-craft-orange"><div className="h-28 rounded-lg bg-gray-100 overflow-hidden">{imageFor(p) && <img src={imageFor(p)} className="w-full h-full object-cover" alt={p.title} />}</div><p className="text-sm font-medium mt-2 truncate">{p.title}</p><p className="text-sm text-craft-orange font-semibold">₹{p.price}</p></Link>)}</div></div>
      </section>
    </div>
  </div>
}
function Info({ label, value }) { return <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">{label}</p><p className="font-medium text-sm mt-1">{value}</p></div> }

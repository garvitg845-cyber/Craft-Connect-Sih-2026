import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, MapPin, Mail, Phone, UserRound, Store } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_VERIFICATIONS } from '../../lib/demoData'

export default function ArtisanVerification() {
  const { user } = useAuth()
  const [artisans, setArtisans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('artisans').select('*, profiles(full_name,contact_email,phone,avatar_url)').order('created_at', { ascending: false })
    if (error) { toast.error(error.message); setLoading(false); return }

    const rows = await Promise.all((data ?? []).map(async (a) => {
      let shopPhotoUrl = ''
      let documentUrl = ''
      if (a.shop_photo_url) {
        const { data: signed } = await supabase.storage.from('verification-docs').createSignedUrl(a.shop_photo_url, 60 * 30)
        shopPhotoUrl = signed?.signedUrl ?? ''
      }
      const { data: verification } = await supabase.from('artisan_verification').select('document_url').eq('artisan_id', a.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (verification?.document_url) {
        const { data: signedDoc } = await supabase.storage.from('verification-docs').createSignedUrl(verification.document_url, 60 * 30)
        documentUrl = signedDoc?.signedUrl ?? ''
      }
      return { ...a, shopPhotoUrl, documentUrl }
    }))
    setArtisans(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    const notes = status === 'rejected' ? prompt('Reason for rejection (shown to artisan):') : null
    const { error } = await supabase.from('artisans').update({ verification_status: status, verification_notes: notes }).eq('id', id)
    if (error) return toast.error(error.message)
    await supabase.from('audit_logs').insert({ actor_id: user.id, action: `artisan_${status}`, target_table: 'artisans', target_id: id, details: { notes } })
    await supabase.from('notifications').insert({ user_id: id, title: `Verification ${status}`, body: notes || `Your artisan profile has been ${status}.` })
    toast.success(`Artisan ${status}`)
    setSelected(null)
    load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Artisan Verification</h1>
      <p className="text-sm text-gray-500 mb-6">Review personal details, profile photo, location and shop/workplace photo before approval.</p>

      {artisans.length === 0 ? (
        <><div className="flex items-center gap-3 mb-3"><DemoBadge /></div><DemoNotice className="mb-5" /><div className="space-y-3">{DEMO_VERIFICATIONS.map((a) => <div key={a.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-3"><div><p className="font-semibold">{a.name}</p><p className="text-sm text-gray-500">{a.business} · {a.craft}</p><p className="text-xs text-gray-400 mt-1">{a.location}</p></div><span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></div>)}</div></>
      ) : (
        <div className="space-y-4">
          {artisans.map((a) => (
            <div key={a.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {a.profiles?.avatar_url ? <img src={a.profiles.avatar_url} className="w-14 h-14 rounded-full object-cover border" alt={a.profiles.full_name} /> : <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center"><UserRound className="w-6 h-6 text-gray-400" /></div>}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{a.profiles?.full_name || a.business_name}</p>
                    <p className="text-sm text-gray-500 truncate">{a.business_name} · {a.craft_type || 'Craft not specified'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{a.district || '—'}, {a.state || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.verification_status === 'approved' ? 'bg-green-100 text-green-700' : a.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.verification_status}</span>
                  <button onClick={() => setSelected(a)} className="btn-outline !px-3 !py-1.5 text-xs inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> View Details</button>
                  {a.verification_status !== 'approved' && <button onClick={() => updateStatus(a.id, 'approved')} className="text-sm text-green-600 font-medium">Approve</button>}
                  {a.verification_status !== 'rejected' && <button onClick={() => updateStatus(a.id, 'rejected')} className="text-sm text-red-600 font-medium">Reject</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4 mb-5">
              <div><h2 className="text-xl font-bold">{selected.profiles?.full_name}</h2><p className="text-sm text-gray-500">{selected.business_name} · {selected.craft_type}</p></div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="card bg-gray-50">
                <h3 className="font-semibold mb-3">Personal details</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex gap-2 items-center"><UserRound className="w-4 h-4" />{selected.profiles?.full_name || '—'}</p>
                  <p className="flex gap-2 items-center break-all"><Mail className="w-4 h-4" />{selected.profiles?.contact_email || '—'}</p>
                  <p className="flex gap-2 items-center"><Phone className="w-4 h-4" />{selected.profiles?.phone || '—'}</p>
                  <p className="flex gap-2 items-center"><MapPin className="w-4 h-4" />{selected.district || '—'}, {selected.state || '—'}</p>
                </div>
              </div>
              <div className="card bg-gray-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Store className="w-4 h-4" /> Shop verification</h3>
                {selected.shopPhotoUrl ? <img src={selected.shopPhotoUrl} className="w-full h-48 object-cover rounded-lg" alt="Shop verification" /> : <p className="text-sm text-red-500">Shop photo not uploaded.</p>}
              </div>
              <div className="card bg-gray-50 md:col-span-2">
                <h3 className="font-semibold mb-3">ID proof / craft certificate</h3>
                {selected.documentUrl ? (
                  <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="text-sm text-craft-orange underline">Open latest verification document</a>
                ) : <p className="text-sm text-gray-500">No additional verification document uploaded.</p>}
              </div>
            </div>

            {selected.profiles?.avatar_url && <div className="mt-5"><h3 className="font-semibold mb-2">Profile photo</h3><img src={selected.profiles.avatar_url} className="w-32 h-32 rounded-xl object-cover border" alt="Artisan profile" /></div>}
            {selected.story && <div className="mt-5"><h3 className="font-semibold mb-1">Craft story</h3><p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.story}</p></div>}

            <div className="flex gap-3 mt-6 pt-5 border-t">
              {selected.verification_status !== 'approved' && <button onClick={() => updateStatus(selected.id, 'approved')} className="btn-primary">Approve Artisan</button>}
              {selected.verification_status !== 'rejected' && <button onClick={() => updateStatus(selected.id, 'rejected')} className="px-5 py-2.5 rounded-lg border border-red-200 text-red-600 font-semibold">Reject</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

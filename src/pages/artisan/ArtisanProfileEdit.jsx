import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Camera, Store, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const emptyForm = {
  full_name: '',
  contact_email: '',
  phone: '',
  business_name: '',
  craft_type: '',
  story: '',
  state: '',
  district: '',
  latitude: '',
  longitude: '',
}

export default function ArtisanProfileEdit() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [avatarFile, setAvatarFile] = useState(null)
  const [shopFile, setShopFile] = useState(null)
  const [documentFile, setDocumentFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [shopPreview, setShopPreview] = useState('')
  const [existingShopPath, setExistingShopPath] = useState('')
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: profile }, { data: artisan }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('artisans').select('*').eq('id', user.id).single(),
      ])

      setForm({
        full_name: profile?.full_name ?? '',
        contact_email: profile?.contact_email ?? user.email ?? '',
        phone: profile?.phone ?? '',
        business_name: artisan?.business_name ?? '',
        craft_type: artisan?.craft_type ?? '',
        story: artisan?.story ?? '',
        state: artisan?.state ?? '',
        district: artisan?.district ?? '',
        latitude: artisan?.latitude ?? '',
        longitude: artisan?.longitude ?? '',
      })
      setStatus(artisan?.verification_status ?? 'pending')
      setAvatarPreview(profile?.avatar_url ?? '')
      setExistingShopPath(artisan?.shop_photo_url ?? '')
      if (artisan?.shop_photo_url) {
        const { data } = await supabase.storage.from('verification-docs').createSignedUrl(artisan.shop_photo_url, 60 * 60)
        setShopPreview(data?.signedUrl ?? '')
      }
      setLoading(false)
    }
    if (user) load()
  }, [user])

  useEffect(() => {
    if (!avatarFile) return
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  useEffect(() => {
    if (!shopFile) return
    const url = URL.createObjectURL(shopFile)
    setShopPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [shopFile])

  const completion = useMemo(() => {
    const required = [form.full_name, form.contact_email, form.phone, form.business_name, form.craft_type, form.state, form.district]
    return required.filter(Boolean).length + (avatarPreview ? 1 : 0) + (shopPreview || existingShopPath ? 1 : 0)
  }, [form, avatarPreview, shopPreview, existingShopPath])

  async function uploadFile(bucket, file, prefix) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${Date.now()}_${prefix}_${safeName}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
    if (error) throw error
    return path
  }

  async function save(e) {
    e.preventDefault()
    if (!form.full_name || !form.contact_email || !form.phone || !form.business_name || !form.craft_type || !form.state || !form.district) {
      toast.error('Please complete all required personal, shop and location details.')
      return
    }
    if (!avatarFile && !avatarPreview) {
      toast.error('Please upload your profile photo.')
      return
    }
    if (!shopFile && !existingShopPath) {
      toast.error('Please upload a clear shop/workplace photo for admin verification.')
      return
    }

    setSaving(true)
    try {
      let avatarPath = null
      let shopPath = existingShopPath || null

      if (avatarFile) avatarPath = await uploadFile('avatars', avatarFile, 'profile')
      if (shopFile) shopPath = await uploadFile('verification-docs', shopFile, 'shop')
      const documentPath = documentFile ? await uploadFile('verification-docs', documentFile, 'document') : null

      const { error: profileError } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        contact_email: form.contact_email.trim(),
        phone: form.phone.trim(),
        ...(avatarPath ? { avatar_url: supabase.storage.from('avatars').getPublicUrl(avatarPath).data.publicUrl } : {}),
      }).eq('id', user.id)
      if (profileError) throw profileError

      const slug = form.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) + '-' + user.id.slice(0, 6)
      const { error: artisanError } = await supabase.from('artisans').update({
        business_name: form.business_name.trim(),
        craft_type: form.craft_type.trim(),
        story: form.story.trim() || null,
        state: form.state.trim(),
        district: form.district.trim(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        shop_photo_url: shopPath,
        public_catalog_slug: slug,
        verification_status: 'pending',
        verification_notes: null,
      }).eq('id', user.id)
      if (artisanError) throw artisanError

      const { error: verificationError } = await supabase.from('artisan_verification').insert({
        artisan_id: user.id,
        document_url: documentPath,
        status: 'pending',
        notes: 'Profile, shop photo and verification details submitted for admin review.',
      })
      if (verificationError) throw verificationError

      await refreshProfile()
      setStatus('pending')
      toast.success('Profile submitted! Admin will verify your artisan account.')
      navigate('/artisan')
    } catch (err) {
      toast.error(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-craft-orange text-sm font-semibold"><ShieldCheck className="w-4 h-4" /> Artisan verification profile</div>
        <h1 className="text-2xl font-bold mt-1">Complete Your Artisan Profile</h1>
        <p className="text-sm text-gray-500 mt-1">These details are required after artisan login. Your shop photo is kept private for admin verification.</p>
      </div>

      <div className="card mb-5 bg-orange-50 border-orange-100">
        <div className="flex justify-between text-sm mb-2"><span className="font-medium">Profile completion</span><span>{completion}/9</span></div>
        <div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full bg-craft-orange transition-all" style={{ width: `${Math.min(100, completion / 9 * 100)}%` }} /></div>
        <p className="text-xs text-gray-600 mt-2">Verification status: <strong className="capitalize">{status}</strong></p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <section className="card space-y-4">
          <h2 className="font-semibold text-lg">Personal Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full Name *"><input required className="input-field mt-1" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Email ID *"><input required type="email" className="input-field mt-1" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>
            <Field label="Phone Number *"><input required type="tel" className="input-field mt-1" placeholder="10-digit mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Profile Photo *">
              <label className="mt-1 flex items-center gap-3 border border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-craft-orange">
                {avatarPreview ? <img src={avatarPreview} className="w-14 h-14 rounded-full object-cover" alt="Profile preview" /> : <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center"><Camera className="w-5 h-5 text-gray-400" /></div>}
                <span className="text-sm text-gray-600">Choose a clear face/profile photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              </label>
            </Field>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Store className="w-5 h-5 text-craft-orange" /> Shop & Craft Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Shop / Business Name *"><input required className="input-field mt-1" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></Field>
            <Field label="Craft Type *"><input required className="input-field mt-1" placeholder="e.g. Pottery, Handloom, Woodcraft" value={form.craft_type} onChange={(e) => setForm({ ...form, craft_type: e.target.value })} /></Field>
          </div>
          <Field label="About Your Craft / Story"><textarea className="input-field mt-1 min-h-28" value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} placeholder="Tell customers about your craft, tradition and experience..." /></Field>
          <Field label="Shop / Workplace Photo *">
            <label className="mt-1 block border border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-craft-orange">
              {shopPreview ? <img src={shopPreview} className="w-full h-48 object-cover rounded-lg" alt="Shop preview" /> : <div className="h-32 flex items-center justify-center text-sm text-gray-500">Upload a clear photo of your shop/workplace</div>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setShopFile(e.target.files?.[0] ?? null)} />
            </label>
            <p className="text-xs text-gray-400 mt-1">Visible to admins for verification; not exposed as a public contact document.</p>
          </Field>
          <Field label="ID Proof / Craft Certificate (optional)">
            <input type="file" accept="image/*,.pdf" className="input-field mt-1" onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-gray-400 mt-1">Existing verification-document support is retained. This file is private and visible to admins only.</p>
          </Field>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold text-lg">Place / Location</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="State *"><input required className="input-field mt-1" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="District / City / Place *"><input required className="input-field mt-1" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
            <Field label="Latitude (optional)"><input type="number" step="any" className="input-field mt-1" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Field>
            <Field label="Longitude (optional)"><input type="number" step="any" className="input-field mt-1" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Field>
          </div>
        </section>

        <button disabled={saving} className="btn-primary w-full py-3">{saving ? 'Submitting for verification...' : 'Save & Submit for Admin Verification'}</button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return <div><label className="text-sm font-medium text-gray-700">{label}</label>{children}</div>
}

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function CustomerProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState({ line1: '', city: '', state: '', pincode: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('customers').select('default_address').eq('id', user.id).single()
      setFullName(profile?.full_name ?? '')
      setPhone(profile?.phone ?? '')
      setAddress(data?.default_address ?? { line1: '', city: '', state: '', pincode: '' })
      setLoading(false)
    }
    if (user && profile) load()
  }, [user, profile])

  async function save() {
    setSaving(true)
    try {
      await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
      await supabase.from('customers').update({ default_address: address }).eq('id', user.id)
      await refreshProfile()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <div className="card space-y-3">
        <input className="input-field" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="input-field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input-field" value={user?.email} disabled />
        <h3 className="font-semibold pt-2">Default Address</h3>
        <input className="input-field" placeholder="Address line" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input-field" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input className="input-field" placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
        </div>
        <input className="input-field" placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
        <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  )
}

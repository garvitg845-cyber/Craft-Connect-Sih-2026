import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signIn(form)
      // Fetch the role directly (freshest read) and redirect accordingly
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      toast.success('Welcome back!')
      navigate(`/${profile?.role ?? 'customer'}`)
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-craft-cream px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Log in to Craft Connect</h1>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input required type="email" className="input-field mt-1" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input required type="password" className="input-field mt-1" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Logging in...' : 'Log In'}</button>
        <p className="text-sm text-center text-gray-500">
          New here? <Link to="/signup" className="text-craft-orange font-medium">Create an account</Link>
        </p>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'customer' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: form.role })
      toast.success('Account created! Check your email to confirm, then log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-craft-cream px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Join Craft Connect</h1>

        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input required className="input-field mt-1" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>

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

        <div>
          <label className="text-sm font-medium">I am a...</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {['customer', 'artisan'].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`py-2.5 rounded-lg border font-medium capitalize ${form.role === r ? 'bg-craft-orange text-white border-craft-orange' : 'border-gray-300 text-gray-600'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Admin accounts are created directly in Supabase by the platform team.</p>
        </div>

        <button disabled={loading} className="btn-primary w-full">{loading ? 'Creating account...' : 'Create Account'}</button>
        <p className="text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="text-craft-orange font-medium">Log in</Link>
        </p>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { callEdgeFunction, supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AISearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults(null)
    try {
      const res = await callEdgeFunction('ai-semantic-search', { query })
      setResults(res.products)
      setFilters(res.filters)
    } catch (err) {
      toast.error(err.message.includes('501') || err.message.includes('not configured')
        ? 'AI search requires the GEMINI_API_KEY to be configured by the admin. See README.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">AI Semantic Search</h1>
      <p className="text-gray-500 mb-6">Try: "handmade eco-friendly gift under ₹1000"</p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input className="input-field flex-1" placeholder="Describe what you're looking for..."
          value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn-primary" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </form>

      {loading && <LoadingSpinner />}

      {filters && (
        <p className="text-xs text-gray-400 mt-4">
          Interpreted as: {JSON.stringify(filters)}
        </p>
      )}

      {results && results.length === 0 && (
        <div className="mt-8">
          <EmptyState title="No matching real products found" subtitle="Nothing in our current catalog matches this search yet — try different terms." />
        </div>
      )}

      {results && results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-8">
          {results.map((p) => (
            <Link to={`/customer/products/${p.id}`} key={p.id} className="card hover:shadow-md">
              <h3 className="font-medium text-sm truncate">{p.title}</h3>
              <p className="text-xs text-gray-500">{p.artisans?.business_name}</p>
              <p className="font-semibold text-craft-orange mt-1">₹{p.price}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

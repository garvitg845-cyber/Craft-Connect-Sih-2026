import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_REVIEWS } from '../../lib/demoData'

export default function ArtisanReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: products } = await supabase.from('products').select('id,title').eq('artisan_id', user.id)
      const ids = (products ?? []).map((p) => p.id)
      if (ids.length === 0) { setLoading(false); return }
      const { data } = await supabase.from('reviews').select('*, products(title)').in('product_id', ids).order('created_at', { ascending: false })
      setReviews(data ?? [])
      setLoading(false)
    }
    if (user) load()
  }, [user])

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold">Customer Reviews</h1>{reviews.length === 0 && <DemoBadge />}</div>
      {reviews.length === 0 ? (
        <><DemoNotice className="mb-5" /><div className="space-y-3">{DEMO_REVIEWS.map((r) => <div key={r.id} className="card"><p className="font-medium text-sm">{r.product} — {'⭐'.repeat(r.rating)}</p><p className="text-sm text-gray-500 mt-1">{r.comment}</p><p className="text-xs text-gray-400 mt-1">{new Date(r.date).toLocaleDateString('en-IN')}</p></div>)}</div></>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card">
              <p className="font-medium text-sm">{r.products?.title} — ⭐{r.rating}</p>
              <p className="text-sm text-gray-500 mt-1">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import { DemoBadge, DemoNotice } from '../../components/DemoPreview'
import { DEMO_RETURNS } from '../../lib/demoData'

const ACTIONS = ['under_review', 'approved', 'rejected', 'refunded', 'replaced']

export default function AdminReturns() {
  const { user } = useAuth()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('returns')
      .select('*, customers(profiles(full_name)), order_items(products(title))')
      .order('created_at', { ascending: false })
    setReturns(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function getEvidenceUrl(path) {
    const { data } = await supabase.storage.from('return-evidence').createSignedUrl(path, 300)
    return data?.signedUrl
  }

  async function viewEvidence(paths) {
    if (!paths?.length) return toast.error('No evidence uploaded')
    const url = await getEvidenceUrl(paths[0])
    if (url) window.open(url, '_blank')
  }

  async function decide(id, status) {
    const notes = prompt(`Notes for this "${status}" decision (visible to customer):`) || null
    const { error } = await supabase.from('returns').update({ status, admin_notes: notes, reviewed_by: user.id }).eq('id', id)
    if (error) return toast.error(error.message)

    await supabase.from('audit_logs').insert({
      actor_id: user.id, action: `return_${status}`, target_table: 'returns', target_id: id, details: { notes },
    })

    toast.success(`Return marked as ${status}`)
    load()
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2"><h1 className="text-2xl font-bold">Returns & Damage Complaints</h1>{returns.length === 0 && <DemoBadge />}</div>
      {returns.length === 0 ? (
        <><DemoNotice className="mb-5" /><div className="space-y-3">{DEMO_RETURNS.map((r) => <div key={r.id} className="card"><div className="flex justify-between items-start"><div><p className="font-medium">{r.product}</p><p className="text-sm text-gray-500">by {r.customer}</p><p className="text-sm text-gray-600 mt-1">{r.reason}</p><p className="text-xs text-gray-400 mt-1">{new Date(r.date).toLocaleDateString('en-IN')}</p></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 capitalize font-medium">{r.status.replace(/_/g, ' ')}</span></div></div>)}</div></>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{r.order_items?.products?.title}</p>
                  <p className="text-sm text-gray-500">by {r.customers?.profiles?.full_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 capitalize font-medium">{r.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {r.evidence_urls?.length > 0 && (
                  <button onClick={() => viewEvidence(r.evidence_urls)} className="text-xs text-tech-teal font-medium">View Evidence</button>
                )}
                {ACTIONS.map((a) => (
                  <button key={a} onClick={() => decide(r.id, a)} className="text-xs px-2 py-1 border rounded-full hover:border-craft-orange capitalize">
                    {a.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function PricingCalculator() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [costs, setCosts] = useState({ materials: '', labour: '', packaging: '', shipping: '', platformFeePct: '10', otherCosts: '', marginPct: '30' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id,title,cost_breakdown').eq('artisan_id', user.id).then(({ data }) => setProducts(data ?? []))
  }, [user])

  function loadProduct(id) {
    setSelectedProduct(id)
    const p = products.find((x) => x.id === id)
    if (p?.cost_breakdown) {
      setCosts({
        materials: p.cost_breakdown.materials ?? '',
        labour: p.cost_breakdown.labour ?? '',
        packaging: p.cost_breakdown.packaging ?? '',
        shipping: p.cost_breakdown.shipping ?? '',
        platformFeePct: p.cost_breakdown.platformFeePct ?? '10',
        otherCosts: p.cost_breakdown.otherCosts ?? '',
        marginPct: p.cost_breakdown.marginPct ?? '30',
      })
    }
  }

  const baseCost = ['materials', 'labour', 'packaging', 'shipping', 'otherCosts']
    .reduce((sum, k) => sum + (Number(costs[k]) || 0), 0)
  const platformFee = baseCost * (Number(costs.platformFeePct) || 0) / 100
  const totalCost = baseCost + platformFee
  const suggestedPrice = totalCost / (1 - (Number(costs.marginPct) || 0) / 100)
  const expectedProfit = suggestedPrice - totalCost

  async function saveToProduct() {
    if (!selectedProduct) return toast.error('Select a product first')
    setSaving(true)
    const { error } = await supabase.from('products').update({
      price: Math.round(suggestedPrice),
      cost_breakdown: { ...costs, calculated_price: Math.round(suggestedPrice), calculated_at: new Date().toISOString() },
    }).eq('id', selectedProduct)
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Price saved to product')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Smart Pricing Calculator</h1>
      <p className="text-gray-500 mb-6">Real cost-based pricing. You always make the final call on the price.</p>

      <div className="card space-y-3">
        <select className="input-field" value={selectedProduct} onChange={(e) => loadProduct(e.target.value)}>
          <option value="">Apply to a product (optional)</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        {[
          ['materials', 'Raw Materials Cost (₹)'],
          ['labour', 'Labour Cost (₹)'],
          ['packaging', 'Packaging Cost (₹)'],
          ['shipping', 'Shipping Cost (₹)'],
          ['otherCosts', 'Other Costs (₹)'],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="text-sm font-medium">{label}</label>
            <input type="number" className="input-field mt-1" value={costs[key]} onChange={(e) => setCosts({ ...costs, [key]: e.target.value })} />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium">Platform/Payment Fee (%)</label>
          <input type="number" className="input-field mt-1" value={costs.platformFeePct} onChange={(e) => setCosts({ ...costs, platformFeePct: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Target Profit Margin (%)</label>
          <input type="number" className="input-field mt-1" value={costs.marginPct} onChange={(e) => setCosts({ ...costs, marginPct: e.target.value })} />
        </div>
      </div>

      <div className="card mt-4 bg-tech-teal/5 border-tech-teal/20">
        <h3 className="font-semibold text-tech-teal mb-3">Calculation Breakdown</h3>
        <Row label="Base Cost (materials+labour+packaging+shipping+other)" value={baseCost} />
        <Row label={`Platform Fee (${costs.platformFeePct}%)`} value={platformFee} />
        <Row label="Total Cost" value={totalCost} bold />
        <Row label={`Suggested Price (at ${costs.marginPct}% margin)`} value={suggestedPrice} bold highlight />
        <Row label="Expected Profit per Unit" value={expectedProfit} bold />
        <button onClick={saveToProduct} disabled={saving || !selectedProduct} className="btn-primary w-full mt-4">
          {saving ? 'Saving...' : 'Save This Price to Selected Product'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, bold, highlight }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? 'font-semibold' : 'text-gray-600'} ${highlight ? 'text-craft-orange text-base' : ''}`}>
      <span>{label}</span>
      <span>₹{isFinite(value) ? value.toFixed(2) : '0.00'}</span>
    </div>
  )
}

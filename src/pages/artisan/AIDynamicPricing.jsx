import { useEffect, useState } from 'react'
import { Sparkles, Save, TrendingUp, ShieldCheck, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, callEdgeFunction } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function AIDynamicPricing(){
  const {user}=useAuth()
  const [products,setProducts]=useState([])
  const [selected,setSelected]=useState('')
  const [imageUrl,setImageUrl]=useState('')
  const [form,setForm]=useState({title:'',description:'',material:'',dimensions:'',production_time_days:'',current_price:'',materials:'',labour:'',packaging:'',shipping:'',otherCosts:''})
  const [result,setResult]=useState(null); const [meta,setMeta]=useState(null); const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false)
  useEffect(()=>{if(user) supabase.from('products').select('id,title,description,material,dimensions,production_time_days,price,cost_breakdown,product_images(storage_path,is_primary)').eq('artisan_id',user.id).order('created_at',{ascending:false}).then(({data})=>setProducts(data||[]))},[user])
  function choose(id){
    setSelected(id); const p=products.find(x=>x.id===id); if(!p)return
    const c=p.cost_breakdown||{}
    setForm({title:p.title||'',description:p.description||'',material:p.material||'',dimensions:p.dimensions||'',production_time_days:p.production_time_days||'',current_price:p.price||'',materials:c.materials||'',labour:c.labour||'',packaging:c.packaging||'',shipping:c.shipping||'',otherCosts:c.otherCosts||c.other||''})
    const img=(p.product_images||[]).find(x=>x.is_primary) || (p.product_images||[])[0]
    setImageUrl(img?.storage_path ? supabase.storage.from('product-images').getPublicUrl(img.storage_path).data.publicUrl : '')
    setResult(null); setMeta(null)
  }
  async function run(e){
    e.preventDefault(); setLoading(true)
    try{
      const r=await callEdgeFunction('ai-dynamic-pricing',{...form,image_url:imageUrl,costs:{materials:Number(form.materials)||0,labour:Number(form.labour)||0,packaging:Number(form.packaging)||0,shipping:Number(form.shipping)||0,otherCosts:Number(form.otherCosts)||0}})
      setResult(r.pricing); setMeta(r); toast.success('AI pricing generated from costs + catalog demand + market feed')
    }catch(e){toast.error(e.message)}finally{setLoading(false)}
  }
  async function save(){
    if(!selected||!result)return; setSaving(true)
    try{const c={...form,costs:{materials:Number(form.materials)||0,labour:Number(form.labour)||0,packaging:Number(form.packaging)||0,shipping:Number(form.shipping)||0,otherCosts:Number(form.otherCosts)||0},ai_pricing:result,pricing_meta:meta,calculated_at:new Date().toISOString()}; const {error}=await supabase.from('products').update({price:Math.round(result.recommended_price),cost_breakdown:c}).eq('id',selected); if(error)throw error; toast.success('Recommended price saved')}catch(e){toast.error(e.message)}finally{setSaving(false)}
  }
  return <div className="max-w-5xl mx-auto px-4 py-8">
    <div className="mb-6"><span className="text-xs font-semibold text-craft-orange uppercase tracking-wider">SIH 26090</span><h1 className="text-3xl font-bold mt-1">AI Dynamic Pricing</h1><p className="text-gray-500 mt-2">Uses your real costs, Craft Connect sales velocity, approved catalog comparables and an optional external market-price feed. If no external feed is configured, the system clearly labels the estimate as internal.</p></div>
    <form onSubmit={run} className="grid lg:grid-cols-2 gap-6">
      <div className="card space-y-3">
        <select className="input-field" value={selected} onChange={e=>choose(e.target.value)}><option value="">Select an existing product</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
        {imageUrl&&<div className="flex items-center gap-3 rounded-xl border p-2"><img src={imageUrl} alt="Product" className="w-16 h-16 rounded-lg object-cover"/><span className="text-xs text-gray-500 inline-flex items-center gap-1"><ImageIcon className="w-4 h-4"/> Primary product image will also be analysed for visible quality/complexity signals.</span></div>}
        {[['title','Product title'],['description','Description'],['material','Material'],['dimensions','Dimensions'],['production_time_days','Production time (days)'],['current_price','Current price (₹)'],['materials','Raw materials cost (₹)'],['labour','Labour cost (₹)'],['packaging','Packaging cost (₹)'],['shipping','Shipping cost (₹)'],['otherCosts','Other costs (₹)']].map(([k,l])=><div key={k}><label className="text-xs font-medium text-gray-500">{l}</label>{k==='description'?<textarea className="input-field mt-1" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>:<input className="input-field mt-1" type={['production_time_days','current_price','materials','labour','packaging','shipping','otherCosts'].includes(k)?'number':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>}</div>)}
        <button className="btn-primary w-full flex justify-center gap-2" disabled={loading}><Sparkles className="w-4 h-4"/>{loading?'Analysing market signals…':'Generate AI Price Recommendation'}</button>
      </div>
      <div className="space-y-4">
        {!result?<div className="card h-full flex flex-col items-center justify-center text-center text-gray-500"><TrendingUp className="w-12 h-12 text-craft-orange mb-3"/><p className="font-semibold text-gray-800">Evidence-based pricing</p><p className="text-sm mt-1">Costs + demand + comparable catalog + optional external market feed</p></div>:<>
          <div className="grid sm:grid-cols-3 gap-3"><Price label="Minimum" value={result.minimum_sustainable_price}/><Price label="Recommended" value={result.recommended_price} hot/><Price label="Premium" value={result.premium_price}/></div>
          <div className="card space-y-3"><div className="flex items-center gap-2"><ShieldCheck className="text-tech-teal"/><b>Confidence {Math.round((result.confidence||0)*100)}%</b></div><p className="text-sm text-gray-600">{result.rationale}</p><div className="rounded-lg bg-orange-50 border p-3"><p className="text-sm font-semibold">Market trend signal</p><p className="text-sm text-gray-600 mt-1">{result.market_trend}</p><p className="text-xs text-gray-400 mt-1">{meta?.external_market_feed_note || 'No external market feed configured.'}</p></div><div><p className="text-sm font-semibold">Pricing factors</p><ul className="list-disc list-inside text-sm text-gray-600">{(result.pricing_factors||[]).map(x=><li key={x}>{x}</li>)}</ul></div><div><p className="text-sm font-semibold">Comparable catalog signals</p><ul className="list-disc list-inside text-sm text-gray-600">{(result.comparable_summary||[]).map(x=><li key={x}>{x}</li>)}</ul></div>{result.image_signal&&<p className="text-xs text-gray-500"><b>Image signal:</b> {result.image_signal}</p>}{selected&&<button type="button" onClick={save} disabled={saving} className="btn-secondary w-full flex justify-center gap-2"><Save className="w-4 h-4"/>{saving?'Saving…':'Save Recommended Price to Product'}</button>}</div>
        </>}
      </div>
    </form>
  </div>
}
function Price({label,value,hot}){return <div className={`card text-center ${hot?'border-craft-orange bg-orange-50/30':''}`}><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold text-craft-orange mt-1">₹{Math.round(Number(value)||0).toLocaleString('en-IN')}</p></div>}

import { useState } from 'react'
import toast from 'react-hot-toast'
import { callEdgeFunction } from '../../lib/supabaseClient'

const SUGGESTIONS = [
  'How are my sales trending?',
  'Which of my products sells best?',
  'Is my inventory running low anywhere?',
  'How should I price my next product?',
]

export default function AIBusinessCopilot() {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask(q) {
    const query = q ?? question
    if (!query.trim()) return
    setMessages((m) => [...m, { role: 'user', text: query }])
    setQuestion('')
    setLoading(true)
    try {
      const res = await callEdgeFunction('ai-business-copilot', { question: query })
      setMessages((m) => [...m, { role: 'assistant', text: res.answer }])
    } catch (err) {
      const msg = err.message.includes('501') || err.message.toLowerCase().includes('not configured')
        ? 'AI Business Copilot requires GEMINI_API_KEY to be configured by the admin. See README.'
        : err.message
      setMessages((m) => [...m, { role: 'assistant', text: msg }])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-[80vh]">
      <h1 className="text-2xl font-bold mb-1">AI Business Copilot</h1>
      <p className="text-gray-500 mb-4">Answers only from your real sales, inventory and review data. It will tell you plainly if there isn't enough data yet.</p>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="text-xs bg-white border rounded-full px-3 py-1.5 hover:border-craft-orange">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-craft-orange text-white ml-auto' : 'bg-white border'}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="text-sm text-gray-400">Thinking through your real data...</div>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex gap-2">
        <input className="input-field flex-1" placeholder="Ask about your sales, pricing, inventory..." value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="btn-secondary" disabled={loading}>Ask</button>
      </form>
    </div>
  )
}

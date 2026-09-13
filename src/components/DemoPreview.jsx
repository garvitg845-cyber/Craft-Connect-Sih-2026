export function DemoBadge() {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Demo Preview</span>
}

export function DemoNotice({ className = '' }) {
  return <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className}`}><strong>Demo preview:</strong> sample data is shown only because this section has no live records. Nothing is saved to your database.</div>
}

export function DemoLineChart({ data, valueKey = 'revenue', valueLabel = 'Revenue', prefix = '₹' }) {
  const width = 760
  const height = 260
  const pad = { left: 50, right: 20, top: 24, bottom: 42 }
  const values = data.map((d) => Number(d[valueKey]) || 0)
  const max = Math.max(...values, 1)
  const points = data.map((d, i) => {
    const x = pad.left + (i * (width - pad.left - pad.right)) / Math.max(data.length - 1, 1)
    const y = height - pad.bottom - ((Number(d[valueKey]) || 0) / max) * (height - pad.top - pad.bottom)
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="card overflow-hidden">
      <div className="flex justify-between items-center mb-3"><div><h3 className="font-semibold">{valueLabel} — last 2 months</h3><p className="text-xs text-gray-500">Illustrative weekly trend for presentation preview</p></div><DemoBadge /></div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px] h-64" role="img" aria-label={`${valueLabel} demo chart`}>
          {[0, 1, 2, 3].map((n) => {
            const y = pad.top + n * ((height - pad.top - pad.bottom) / 3)
            return <line key={n} x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="currentColor" className="text-gray-100" />
          })}
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" className="text-craft-orange" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
            const x = pad.left + (i * (width - pad.left - pad.right)) / Math.max(data.length - 1, 1)
            const y = height - pad.bottom - ((Number(d[valueKey]) || 0) / max) * (height - pad.top - pad.bottom)
            return <g key={`${d.label}-${i}`}><circle cx={x} cy={y} r="5" fill="currentColor" className="text-craft-orange" /><text x={x} y={height - 16} textAnchor="middle" fontSize="11" fill="currentColor" className="text-gray-500">{d.label}</text></g>
          })}
          <text x="8" y="18" fontSize="11" fill="currentColor" className="text-gray-500">{prefix}{Math.round(max).toLocaleString('en-IN')}</text>
        </svg>
      </div>
    </div>
  )
}

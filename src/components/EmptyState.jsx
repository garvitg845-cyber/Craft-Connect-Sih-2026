export default function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="text-5xl mb-3">🪔</div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-4">{actionLabel}</button>
      )}
    </div>
  )
}

export default function LoadingSpinner({ full }) {
  return (
    <div className={full ? 'min-h-screen flex items-center justify-center' : 'flex items-center justify-center py-10'}>
      <div className="h-8 w-8 border-4 border-craft-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

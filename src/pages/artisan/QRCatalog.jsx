import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function QRCatalog() {
  const { user } = useAuth()
  const [artisan, setArtisan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('artisans').select('*').eq('id', user.id).single().then(({ data }) => { setArtisan(data); setLoading(false) })
  }, [user])

  const catalogUrl = artisan ? `${window.location.origin}/customer/artisans/${artisan.id}` : ''

  function downloadQR() {
    const canvas = document.getElementById('artisan-qr')
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'craft-connect-catalog-qr.png'
    a.click()
  }

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl)
    toast.success('Link copied')
  }

  if (loading) return <LoadingSpinner full />

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <h1 className="text-2xl font-bold mb-2">QR Digital Catalog</h1>
      {artisan?.verification_status !== 'approved' ? (
        <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3">
          Your QR code will work once your profile is verified — visitors won't be able to see your catalog until then.
        </p>
      ) : (
        <p className="text-gray-500 mb-6">Print this at exhibitions and fairs — scanning it opens your real, live catalog.</p>
      )}

      <div className="card inline-block">
        <QRCodeCanvas id="artisan-qr" value={catalogUrl} size={220} level="H" includeMargin />
      </div>

      <p className="text-xs text-gray-400 mt-4 break-all">{catalogUrl}</p>

      <div className="flex gap-3 justify-center mt-6">
        <button onClick={downloadQR} className="btn-primary">Download QR</button>
        <button onClick={copyLink} className="btn-outline">Copy Link</button>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, Check, Maximize2, RotateCcw, Sparkles, Trash2, ZoomIn, ZoomOut, WandSparkles } from 'lucide-react'
import { callEdgeFunction } from '../lib/supabaseClient'
import { imageToDataUrl } from '../lib/imageCompressor'
import { Capacitor } from '@capacitor/core'
import { Camera as NativeCamera, CameraResultType, CameraSource } from '@capacitor/camera'

const MAX_PHOTOS = 6

function filePreview(file) {
  return URL.createObjectURL(file)
}

function dataUrlToFile(dataUrl, name='studio-clean.png') {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/data:(.*?);base64/)?.[1] || 'image/png'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], name, { type: mime })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function enhanceFile(file, { brightness = 100, contrast = 100, sharpen = 1 } = {}) {
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const img = await loadImage(src)
  const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
  ctx.drawImage(img, 0, 0, width, height)

  if (sharpen > 0) {
    const image = ctx.getImageData(0, 0, width, height)
    const source = image.data
    const output = new Uint8ClampedArray(source)
    const strength = Math.min(1.5, Math.max(0, sharpen))
    const center = 1 + 4 * strength
    const side = -strength
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = (y * width + x) * 4
        for (let c = 0; c < 3; c += 1) {
          const value = source[i + c] * center
            + source[i - 4 + c] * side
            + source[i + 4 + c] * side
            + source[i - width * 4 + c] * side
            + source[i + width * 4 + c] * side
          output[i + c] = Math.max(0, Math.min(255, value))
        }
      }
    }
    image.data.set(output)
    ctx.putImageData(image, 0, 0)
  }

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '-enhanced.jpg', { type: 'image/jpeg' })
}

export default function ImageLab({ files, setFiles, maxPhotos = MAX_PHOTOS, compact = false }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [sharpen, setSharpen] = useState(0.7)
  const [processing, setProcessing] = useState(false)
  const [aiPlan, setAiPlan] = useState(null)
  const [removingBackground, setRemovingBackground] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const previews = useMemo(() => files.map(filePreview), [files])

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews])


  useEffect(() => {
    if (!cameraOpen) return undefined
    let cancelled = false
    setCameraError('')
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera is not available in this browser. Use the phone camera button instead.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        setCameraError(e?.message || 'Camera permission was denied or the camera is unavailable.')
      }
    }
    start()
    return () => { cancelled = true; if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null } }
  }, [cameraOpen])


  async function captureNativeCamera() {
    try {
      const photo = await NativeCamera.getPhoto({ quality: 92, resultType: CameraResultType.Uri, source: CameraSource.Camera, correctOrientation: true, allowEditing: false })
      if (!photo.webPath) throw new Error('The native camera did not return an image.')
      const response = await fetch(photo.webPath)
      const blob = await response.blob()
      const file = new File([blob], `craft-native-camera-${Date.now()}.${photo.format || 'jpeg'}`, { type: blob.type || 'image/jpeg' })
      if (files.length >= maxPhotos) return toast(`Only ${maxPhotos} photos can be attached.`, { icon: '📷' })
      setFiles(prev => [...prev, file]); setActive(files.length); toast.success('Native camera photo added.')
    } catch (e) {
      if (e?.message?.toLowerCase?.().includes('cancel')) return
      toast.error(e?.message || 'Could not open the native camera.')
    }
  }

  async function openCamera() {
    if (Capacitor.isNativePlatform()) return captureNativeCamera()
    setCameraOpen(true)
  }

  function closeCamera() {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setCameraOpen(false)
  }

  function captureFromCamera() {
    const video = videoRef.current
    if (!video || video.readyState < 2) return toast.error('Camera is still starting. Try again in a moment.')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return toast.error('Could not capture the photo.')
      const file = new File([blob], `craft-camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      if (files.length >= maxPhotos) toast(`Only ${maxPhotos} photos can be attached.`, { icon: '📷' })
      else { setFiles(prev => [...prev, file]); setActive(files.length); toast.success('Camera photo added.') }
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  function addFiles(event) {
    const incoming = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'))
    const room = Math.max(0, maxPhotos - files.length)
    if (incoming.length > room) toast(`Only ${maxPhotos} photos can be attached.`, { icon: '📷' })
    if (incoming.length && room) setFiles(prev => [...prev, ...incoming.slice(0, room)])
    event.target.value = ''
  }

  function remove(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setActive(index > 0 ? Math.min(active, index - 1) : 0)
  }

  async function enhanceSelected() {
    if (!files.length) return toast.error('Add a photo first.')
    setProcessing(true)
    try {
      const next = [...files]
      next[active] = await enhanceFile(files[active], { brightness, contrast, sharpen })
      setFiles(next)
      toast.success('Photo enhanced locally — no API key needed.')
    } catch (e) {
      toast.error(`Could not enhance this photo: ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }

  async function enhanceAll() {
    if (!files.length) return toast.error('Add photos first.')
    setProcessing(true)
    try {
      const next = []
      for (const file of files) next.push(await enhanceFile(file, { brightness, contrast, sharpen }))
      setFiles(next)
      toast.success(`${next.length} photos enhanced locally.`)
    } catch (e) {
      toast.error(`Could not enhance photos: ${e.message}`)
    } finally {
      setProcessing(false)
    }
  }


  async function removeBackground() {
    if (!files.length) return toast.error('Add a product photo first.')
    setRemovingBackground(true)
    try {
      const dataUrl = await imageToDataUrl(files[active], { maxSide: 1600, maxBytes: 900 * 1024, quality: 0.8 })
      const res = await callEdgeFunction('ai-photo-studio', { image_data_url: dataUrl, remove_background: true })
      if (!res.cleaned_image_data_url) return toast('Add REMOVE_BG_API_KEY in Supabase Edge Function Secrets to enable automatic background removal.', { icon: 'ℹ️' })
      const next = [...files]
      next[active] = dataUrlToFile(res.cleaned_image_data_url, files[active].name.replace(/\.[^.]+$/, '') + '-background-removed.png')
      setFiles(next)
      toast.success('Background removed. Review the transparent cutout before publishing.')
    } catch (e) { toast.error(e.message) } finally { setRemovingBackground(false) }
  }

  async function applyAIStudio() {
    if (!files.length) return toast.error('Add a product photo first.')
    setProcessing(true)
    try {
      const dataUrl = await imageToDataUrl(files[active], { maxSide: 1200, maxBytes: 500 * 1024, quality: 0.72 })
      const res = await callEdgeFunction('ai-photo-studio', { image_data_url: dataUrl })
      const plan = res.plan || {}
      setAiPlan(plan)
      const next = [...files]
      next[active] = await enhanceFile(files[active], {
        brightness: Math.max(90, Math.min(120, Number(plan.brightness) || 105)),
        contrast: Math.max(90, Math.min(120, Number(plan.contrast) || 105)),
        sharpen: Math.max(0, Math.min(1.2, Number(plan.sharpness) || 0.8)),
      })
      setFiles(next)
      toast.success('AI studio plan applied. Review the photo before publishing.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setProcessing(false)
    }
  }

  function resetControls() {
    setBrightness(100)
    setContrast(100)
    setSharpen(0.7)
    setZoom(1)
  }

  const current = previews[active]

  return (
    <div className={compact ? '' : 'card'}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold">Product photo lab</p>
          <p className="text-xs text-gray-500">Up to {maxPhotos} photos · crop-ready zoom · local sharpness enhancement</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={openCamera} className="btn-secondary text-sm inline-flex items-center gap-2">
            <Camera className="w-4 h-4" /> Open camera
          </button>
          <label className="btn-outline text-sm cursor-pointer inline-flex items-center gap-2">
            <Camera className="w-4 h-4" /> Phone camera / gallery
            <input hidden type="file" accept="image/*" capture="environment" multiple onChange={addFiles} />
          </label>
        </div>
      </div>

      {current ? (
        <>
          <div className="relative h-72 rounded-xl overflow-hidden bg-gray-100 border flex items-center justify-center">
            <img
              src={current}
              alt="Selected product preview"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
            <div className="absolute top-2 right-2 flex gap-1 bg-white/90 rounded-lg p-1 shadow">
              <button type="button" className="p-2" onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
              <button type="button" className="p-2" onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))} title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
              <button type="button" className="p-2" onClick={resetControls} title="Reset"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            {previews.map((src, index) => (
              <div key={`${src}-${index}`} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${index === active ? 'border-craft-orange' : 'border-transparent'}`}>
                <button type="button" onClick={() => setActive(index)} className="w-full h-full">
                  <img src={src} alt={`Product photo ${index + 1}`} className="w-full h-full object-cover" />
                </button>
                {index === 0 && <span className="absolute left-1 bottom-1 text-[9px] bg-white/90 rounded px-1 font-semibold">PRIMARY</span>}
                <button type="button" onClick={() => remove(index)} className="absolute right-1 top-1 bg-white/90 rounded-full p-1 text-red-600" title="Remove photo"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-4">
            <label className="text-xs text-gray-500">Brightness {brightness}%<input type="range" min="80" max="125" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full" /></label>
            <label className="text-xs text-gray-500">Contrast {contrast}%<input type="range" min="80" max="125" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full" /></label>
            <label className="text-xs text-gray-500">Sharpness {sharpen.toFixed(1)}<input type="range" min="0" max="1.2" step="0.1" value={sharpen} onChange={e => setSharpen(Number(e.target.value))} className="w-full" /></label>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" disabled={processing || removingBackground} onClick={applyAIStudio} className="btn-primary text-sm inline-flex items-center gap-2"><WandSparkles className="w-4 h-4" /> {processing ? 'AI studio working…' : 'AI Studio: analyse + enhance'}</button>
            <button type="button" disabled={processing || removingBackground} onClick={removeBackground} className="btn-secondary text-sm inline-flex items-center gap-2"><WandSparkles className="w-4 h-4" /> {removingBackground ? 'Removing…' : 'Remove background'}</button>
            <button type="button" disabled={processing} onClick={enhanceSelected} className="btn-secondary text-sm inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Enhance selected</button>
            <button type="button" disabled={processing} onClick={enhanceAll} className="btn-outline text-sm inline-flex items-center gap-2"><Check className="w-4 h-4" /> Enhance all</button>
          </div>
          {aiPlan && <div className="mt-3 rounded-xl border bg-tech-teal/5 p-3 text-xs text-gray-600"><p className="font-semibold text-gray-800">AI Studio edit plan</p><p className="mt-1">Background: {aiPlan.background_action} · Crop: {aiPlan.crop_hint}</p>{aiPlan.detected_issues?.length>0&&<p className="mt-1">Detected: {aiPlan.detected_issues.join(' · ')}</p>}<p className="mt-1 text-gray-400">The current correction is applied locally in your browser; the AI plan does not upload your original image to storage.</p></div>}
          <span className="text-xs text-gray-400 block mt-2">For true automatic background removal, configure an optional background-removal provider; this version keeps the core AI studio provider-agnostic and avoids sending originals to third parties.</span>
        </>
      ) : (
        <label className="h-56 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer bg-orange-50/30">
          <Maximize2 className="w-9 h-9 text-craft-orange" />
          <span className="mt-2 text-sm font-medium">Add 1–6 product photos</span>
          <span className="text-xs text-gray-400 mt-1">Front, detail, back, texture, packaging and lifestyle shots</span>
          <input hidden type="file" accept="image/*" multiple onChange={addFiles} />
        </label>
      )}

      {cameraOpen && <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div><p className="font-semibold">Craft camera</p><p className="text-xs text-gray-500">Capture a clean product photo directly from your device.</p></div>
            <button type="button" onClick={closeCamera} className="text-gray-500">✕</button>
          </div>
          <div className="bg-black aspect-video flex items-center justify-center">
            {cameraError ? <div className="text-white text-sm text-center px-6"><p>{cameraError}</p><label className="btn-primary mt-4 inline-flex cursor-pointer">Use phone camera / gallery<input hidden type="file" accept="image/*" capture="environment" onChange={e => { addFiles(e); closeCamera() }} /></label></div> : <video ref={videoRef} className="w-full h-full object-contain" playsInline muted autoPlay />}
          </div>
          <div className="p-4 flex gap-2 justify-end">
            <button type="button" onClick={closeCamera} className="btn-outline">Cancel</button>
            <button type="button" onClick={captureFromCamera} className="btn-primary inline-flex items-center gap-2"><Camera className="w-4 h-4"/> Capture photo</button>
          </div>
        </div>
      </div>}
    </div>
  )
}

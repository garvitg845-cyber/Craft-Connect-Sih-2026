export async function compressImage(file, { maxSide = 1280, maxBytes = 700 * 1024, quality = 0.72 } = {}) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Please select a valid image.')
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read the image.'))
      img.src = objectUrl
    })
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    let q = quality
    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q))
    while (blob && blob.size > maxBytes && q > 0.45) {
      q -= 0.06
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', q))
    }
    if (!blob) throw new Error('Could not compress image.')
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-optimized.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally { URL.revokeObjectURL(objectUrl) }
}

export async function imageToDataUrl(file, options = {}) {
  const optimized = await compressImage(file, options)
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(optimized)
  })
}

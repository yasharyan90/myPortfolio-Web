/**
 * Browser-side image preparation for the gallery. Supabase's free tier has no server-side
 * resizing, so the console makes two files per photo before uploading:
 *  - full:  the original if it is already ≤ maxFull px and ≤ 6 MB, otherwise a JPEG re-encode
 *  - thumb: a ~640 px JPEG for the grid
 * EXIF orientation is honoured by createImageBitmap where the browser supports it.
 */

export interface PreparedImage {
  full: Blob
  thumb: Blob
  width: number
  height: number
  /** file extension for `full` */
  ext: 'jpg' | 'png' | 'webp' | 'gif'
}

const MAX_BYTES = 6 * 1024 * 1024

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('That image could not be read'))
      img.src = URL.createObjectURL(file)
    })
  }
}

function draw(source: ImageBitmap | HTMLImageElement, maxEdge: number, type: string, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const scale = Math.min(1, maxEdge / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve({ blob, width: w, height: h }) : reject(new Error('Could not encode image'))), type, quality),
  )
}

export async function prepareImage(file: File, opts: { maxFull?: number; maxThumb?: number } = {}): Promise<PreparedImage> {
  const maxFull = opts.maxFull ?? 2400
  const maxThumb = opts.maxThumb ?? 640
  const source = await decode(file)
  const sw = 'naturalWidth' in source ? source.naturalWidth : source.width
  const sh = 'naturalHeight' in source ? source.naturalHeight : source.height
  const thumb = await draw(source, maxThumb, 'image/jpeg', 0.84)

  const keepOriginal = Math.max(sw, sh) <= maxFull && file.size <= MAX_BYTES && /^image\/(jpeg|png|webp|gif)$/.test(file.type)
  if (keepOriginal) {
    const ext = file.type === 'image/jpeg' ? 'jpg' : (file.type.split('/')[1] as PreparedImage['ext'])
    return { full: file, thumb: thumb.blob, width: sw, height: sh, ext }
  }
  const full = await draw(source, maxFull, 'image/jpeg', 0.9)
  return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height, ext: 'jpg' }
}

export const newImageId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

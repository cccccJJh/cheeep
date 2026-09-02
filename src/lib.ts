export function formatWon(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function toDateInput(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromDateInput(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function parsePrice(raw: string): number | null {
  const n = Number(raw.replace(/[^\d]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

export function parseOptionalPrice(raw: string): number | null | undefined {
  if (!raw.trim()) return undefined
  return parsePrice(raw)
}

export function vsTarget(price: number, target: number): string {
  if (price <= target) {
    return price === target
      ? `기준가 ${formatWon(target)}와 같음`
      : `기준가보다 ${formatWon(target - price)} 쌈`
  }
  return `기준가보다 ${formatWon(price - target)} 비쌈`
}

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const max = 1280
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82)
  })
  return blob ?? file
}

import type { ComparisonUnit } from './db'

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

const UNIT_LABEL: Record<ComparisonUnit, string> = {
  '100g': '100g당',
  '100ml': '100ml당',
  each: '개당',
}

const SIZE_SUFFIX: Record<ComparisonUnit, string> = {
  '100g': 'g',
  '100ml': 'ml',
  each: '개',
}

export function formatUnitPrice(won: number, unit: ComparisonUnit): string {
  return `${UNIT_LABEL[unit]} ${formatWon(Math.round(won))}`
}

export function unitHeadline(unit: ComparisonUnit): string {
  if (unit === 'each') return '1개당'
  if (unit === '100ml') return '100ml당'
  return '100g당'
}

export function unitBasis(unit: ComparisonUnit): string {
  if (unit === 'each') return '1개 기준'
  if (unit === '100ml') return '100ml 기준'
  return '100g 기준'
}

export function sizeUnitShort(unit: ComparisonUnit): string {
  if (unit === 'each') return '개'
  if (unit === '100ml') return 'ml'
  return 'g'
}

export function formatPackageSize(size: number, unit: ComparisonUnit): string {
  if (unit === '100g' && size >= 1000 && size % 1000 === 0) {
    return `${size / 1000}kg`
  }
  return `${size.toLocaleString('ko-KR')}${SIZE_SUFFIX[unit]}`
}

export function sizeFieldLabel(unit: ComparisonUnit): string {
  if (unit === '100g') return '용량 (g)'
  if (unit === '100ml') return '용량 (ml)'
  return '수량 (개)'
}

export function sizePlaceholder(unit: ComparisonUnit): string {
  if (unit === '100g') return '예: 500'
  if (unit === '100ml') return '예: 1500'
  return '예: 2'
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

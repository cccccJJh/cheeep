export type SizeUnit = 'g' | 'kg' | 'ml' | 'L'
export type PackageInfo = { quantity?: number; capacity?: number; capacityUnit?: SizeUnit }
export function parsePackage(quantity: string, capacity: string, capacityUnit: SizeUnit): PackageInfo {
  const q = quantity.trim() ? Number(quantity) : undefined
  const c = capacity.trim() ? Number(capacity) : undefined
  if (q != null && (!Number.isInteger(q) || q <= 0)) throw new Error('개수는 1 이상의 정수로 입력해 주세요.')
  if (c != null && (!Number.isFinite(c) || c <= 0)) throw new Error('개당 용량은 0보다 큰 숫자로 입력해 주세요.')
  return { quantity: q, capacity: c, capacityUnit: c == null ? undefined : capacityUnit }
}
export function PackageFields({ quantity, capacity, unit, onQuantity, onCapacity, onUnit }: { quantity: string; capacity: string; unit: SizeUnit; onQuantity: (value: string) => void; onCapacity: (value: string) => void; onUnit: (value: SizeUnit) => void }) {
  return <div className="package-fields"><label>개수 (선택)<input className="field" aria-label="개수" inputMode="numeric" value={quantity} onChange={e => onQuantity(e.target.value)} placeholder="예: 3" /></label><label>개당 용량 (선택)<div className="capacity-field"><input className="field" aria-label="개당 용량" inputMode="decimal" value={capacity} onChange={e => onCapacity(e.target.value)} placeholder="예: 200" /><select className="field" aria-label="용량 단위" value={unit} onChange={e => onUnit(e.target.value as SizeUnit)}><option>g</option><option>kg</option><option>ml</option><option>L</option></select></div></label></div>
}
